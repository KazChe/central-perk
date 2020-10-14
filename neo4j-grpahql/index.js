const { makeAugmentedSchema } = require('neo4j-graphql-js')
const { ApolloServer } = require('apollo-server')
const neo4j = require('neo4j-driver')
require('dotenv').config()

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
        
        tags: [Tag] @cypher(statement: """
        MATCH (this)-->(t:OSMTags)
        UNWIND keys(t) AS key
        RETURN {key: key, value: t[key]}
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
    process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD))
const apolloServer = new ApolloServer({schema, context: {driver} })

apolloServer.listen(3003, '0.0.0.0').then(({ url }) => {
    console.log(`Apollo Server Ready at ${url}`)
})
