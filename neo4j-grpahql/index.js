const { makeAugmentedSchema } = require('neo4j-graphql-js')
const { ApolloServer } = require('apollo-server')
const neo4j = require('neo4j-driver')
require('dotenv').config()
const axios = require('axios')

/*
  Note regarding the first cypher directive used.
  PointOfInterest have a relationship with OSMTags
  where various meta-data (key/value) about that PointOfInterest
  are kept. However, each OSMTags based what type of
  PointOfInterest it represents has different key names.
  Using the cypher statement
 */
const typeDefs = `

    type Step {
        latitude: Float
        longitude: Float
    }
    
    type Tag {
        key: String
        value: String
    }
    
    type PointOfInterest {
        name: String
        location: Point
        type: String
        node_osm_id: ID!
        wikipedia: String @cypher(statement: """
        match (this)-->(t:OSMTags)
        where exists(t.wikipedia) with t limit 1
        call apoc.load.json('https://en.wikipedia.org/w/api.php?action=parse&prop=text&formatversion=2&format=json&page='+apoc.text.urlencode(t.wikipedia)) yield value
        return value.parse.text
        """)
        photos(first: Int = 5, radius: Int = 100): [String] @neo4j_ignore
        tags: [Tag] @cypher(statement: """
        MATCH (this)-->(t:OSMTags)
        UNWIND keys(t) AS key
        RETURN {key: key, value: t[key]}
        """)
        routeToPOI(poi: ID!): [Step] @cypher(statement: """
        MATCH (other:PointOfInterest {node_osm_id: $poi})
        MATCH sp=shortestPath( (this)-[:ROUTE*..200]-(other) )
        UNWIND nodes(sp) AS node
        RETURN { latitude: node.location.latitude, longitude: node.location.longitude} AS route
        """)
    }
    
    type CitiesByUUID {
        cities(ids: [String!]): [String!]
    }
`
const resolvers = {
    PointOfInterest: {
        photos: async (poi, args) => {
          const requestURL = `https://a.mapillary.com/v3/images?client_id=${process.env.MAPILLARY_KEY}&lookat=${poi.location.longitude},${poi.location.latitude}&closeto=${poi.location.longitude},${poi.location.latitude}&radius=${args.radius}&per_page=${args.first}`
            const response = await axios.get(requestURL)

            const features = response.data.features
            return features.map((v) => {
              return `https://images.mapillary.com/${v.properties.key}/thumb-640.jpg`
            })
        }
    },
    CitiesByUUID: {
        cities: async (ids, args) => {
            const session = driver.session;
            const uuIds = split(args)
            const result = await session.run(
                `CALL apoc.cypher.run(MATCH(c:City) WHERE c.name IN [${uuIds}] RETURN c, {}) YIELD value RETURN value`
            )
        }
    }
}

const schema = makeAugmentedSchema({typeDefs, resolvers})
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD))
const apolloServer = new ApolloServer({schema, context: {driver} })

apolloServer.listen(3003, '0.0.0.0').then(({ url }) => {
    console.log(`Apollo Server Ready at ${url}`)
})