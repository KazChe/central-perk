const { makeAugmentedSchema } = require('neo4j-graphql-js')
const { ApolloServer } = require('apollo-server')
const neo4j = require('neo4j-driver')

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
    
    type PointOfInterest {
        name: String
        location: Point
        type: String
        node_osm_id: Int
        tags: [String] @cypher(statement: """
        MATCH (this)-[:TAGS]->(t:OSMTags)
        RETURN keys(t)
        """)
        routeToPOI(poi: Int!): [Step] @cypher(statement: """
        MATCH (other:PointOfInterest {node_osm_id: $poi})
        MATCH sp=shortestPath( (this)-[:ROUTE*..200]-(other) )
        UNWIND nodes(sp) AS node
        RETURN { latitude: node.location.latitude, longitude: node.location.longitude} AS route
        """)
    }
`

const schema = makeAugmentedSchema({typeDefs})
const driver = neo4j.driver(
    "bolt://54.237.210.186:33242", neo4j.auth.basic("neo4j", "forecast-coordinates-targets"))
const apolloServer = new ApolloServer({schema, context: {driver} })

apolloServer.listen(3003, '0.0.0.0').then(({ url }) => {
    console.log(`Apollo Server Ready at ${url}`)
})
