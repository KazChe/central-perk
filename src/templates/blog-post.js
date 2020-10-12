import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"

const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.poi.PointOfInterest[0]
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const { previous, next } = pageContext

  return (
    <Layout location={location} title={siteTitle}>
      <SEO
        title={post.name}
        description={post.type}
      />
      <article
        className="blog-post"
        itemScope
        itemType="http://schema.org/Article"
      >
        <header>
          <h1 itemProp="headline">{post.name}</h1>
          <p>{post.node_osm_id}</p>
        </header>
          <p>
              <ul>
                  {post.tags?.map((t,i) => {
                      return <li key={i}><strong>{t.key}</strong>: {t.value}</li>
                  })}
              </ul>
          </p>
        <hr />
        <footer>
          <Bio />
        </footer>
      </article>
      <nav className="blog-post-nav">
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={`/`+previous.node_osm_id} rel="prev">
                ← {previous.name}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={`/`+next.node_osm_id} rel="next">
                {next.name} →
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </Layout>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
    query POIBySlug($slug: ID!) {
        site {
            siteMetadata {
                title
            }
        }
        poi{
            PointOfInterest(node_osm_id: $slug ) {
                name
                type
                location {
                    longitude
                    latitude
                }
                tags {
                    key
                    value
                }
            }
        }
    }
`
