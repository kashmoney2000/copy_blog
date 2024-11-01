import { getAllPosts, getBlocks, getPage, getPosts } from '@/lib/notion'
import React from 'react'
import { renderToString } from 'react-dom/server'

import { Fragment } from 'react'
import Head from 'next/head'
// import Link from 'next/link'
import Link from '@/components/Link'

import { Container, Title, Text, Overlay, createStyles, Code, Box, Group } from '@mantine/core'
// import TableOfContents from '@/components/TableOfContents'
import { Prism } from '@mantine/prism'
import styles from '@/css/post.module.css'
// Prevents Video Player from creating mismatch UI hydration glitch
import dynamic from 'next/dynamic'
import { PageSEO } from '@/components/SEO'
import PostLayout from '@/layouts/PostLayout'
import siteMetadata from '@/data/siteMetadata'
import PageTitle from '@/components/PageTitle'
import readingTime from 'reading-time'
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

const DEFAULT_LAYOUT = 'PostLayout'

// export const getStaticPaths = async () => {
//   const posts = await getPosts(process.env.NOTION_DATABASE_ID)
//   const paths = posts?.map((page) => ({ params: { id: page.id } }))
//   return {
//     paths,
//     fallback: true,
//   }
// }

// export async function getStaticPaths() {
//   // const posts = getFiles('blog')
//   // return {
//   //   paths: posts.map((p) => ({
//   //     params: {
//   //       slug: formatSlug(p).split('/'),
//   //     },
//   //   })),
//   //   fallback: false,
//   // }
//   return {
//     paths: [],
//     fallback: false,
//   }
// }
export default function Blog({ page, blocks, links, code }) {
  //export default function Blog({ post, authorDetails, prev, next }) {
  const mdxSource = code
  const toc = null
  const prev = page
  const next = page
  const authorDetails = null
  const metadata = page.properties
  // const { mdxSource, toc, metadata } = post
  return (
    <>
      {metadata.draft == null || metadata.draft !== true ? (
        // <MDXLayoutRenderer
        //   layout={metadata.layout || DEFAULT_LAYOUT}
        //   toc={toc}
        //   mdxSource={mdxSource}
        //   frontMatter={metadata}
        //   authorDetails={authorDetails}
        //   prev={prev}
        //   next={next}
        // />
        <>
          <PageSEO title={siteMetadata.title} description={siteMetadata.description} />
          <PostLayout frontMatter={metadata} authorDetails={authorDetails} next={next} prev={prev}>
            {blocks.map((block) => (
              <Fragment key={block.id}>{renderBlock(block)}</Fragment>
            ))}
          </PostLayout>
        </>
      ) : (
        <div className="mt-24 text-center">
          <PageTitle>
            Under Construction{' '}
            <span role="img" aria-label="roadwork sign">
              🚧
            </span>
          </PageTitle>
        </div>
      )}
    </>
  )
}
//-----------------------------------------------------------------------------------
const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    paddingTop: 180,
    paddingBottom: 130,

    backgroundSize: 'cover',
    backgroundPosition: 'center',

    '@media (max-width: 520px)': {
      paddingTop: 80,
      paddingBottom: 50,
    },
  },

  inner: {
    position: 'relative',
    zIndex: 1,
  },

  title: {
    fontWeight: 800,
    fontSize: 40,
    letterSpacing: -1,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    color: theme.white,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,

    '@media (max-width: 520px)': {
      fontSize: 28,
      textAlign: 'left',
    },
  },

  highlight: {
    color: theme.colors[theme.primaryColor][4],
  },

  description: {
    color: theme.colors.gray[0],
    textAlign: 'center',

    '@media (max-width: 520px)': {
      fontSize: theme.fontSizes.md,
      textAlign: 'left',
    },
  },

  code: {
    fontFamily: 'monospace',
    backgroundColor: theme.colorScheme === 'dark' ? 'lightgrey' : 'darkgrey',
    padding: '2px 4px',
    borderRadius: '2px',
    color: theme.colorScheme === 'dark' ? theme.black : theme.white,
  },
}))

export const TextBlock = (text) => {
  const { classes } = useStyles()
  if (!text) {
    return null
  }
  return text.text.map((value) => {
    const {
      annotations: { bold, code, color, italic, strikethrough, underline },
      text,
    } = value
    return (
      <span
        className={[
          bold ? styles.bold : '',
          code ? classes.code : '',
          italic ? styles.italic : '',
          strikethrough ? styles.strikethrough : '',
          underline ? styles.underline : '',
        ].join(' ')}
        style={color !== 'default' ? { color } : {}}
        key={value.id}
      >
        {/*{text.link ? <a href={blogPrefix + text.link.url}>{text.content}</a> : text.content}*/}
        {text.link ? (
          <Link
            href={`/blog/${text.link.url.replace(/-/g, '')}`}
            className="text-gray-900 transition duration-500 ease-in-out hover:text-primary-500 dark:text-gray-100 dark:hover:text-primary-500"
          >
            {text.content}
          </Link>
        ) : (
          text.content
        )}
      </span>
    )
  })
}

const renderNestedList = (block) => {
  const { type } = block
  const value = block[type]
  if (!value) return null

  const isNumberedList = value.children[0].type === 'numbered_list_item'

  if (isNumberedList) {
    return <ol>{value.children.map((block) => renderBlock(block))}</ol>
  }
  return <ul>{value.children.map((block) => renderBlock(block))}</ul>
}

const renderBlock = (block) => {
  const { type, id } = block
  const value = block[type]

  let blockColor
  const b4Underscore = new RegExp('^[^_]+')
  if (!value.color || type === 'divider' || value.color === 'default') {
    blockColor = 'none'
  } else {
    blockColor = value.color.match(b4Underscore)[0]
  }

  // console.log(blockColor)

  switch (type) {
    case 'paragraph':
      return (
        <p style={{ backgroundColor: blockColor }}>
          <TextBlock text={value.rich_text} />
        </p>
      )
    case 'heading_1':
      return (
        <h1 id={`id${id}`} style={{ backgroundColor: blockColor }}>
          <TextBlock text={value.rich_text} />
        </h1>
      )
    case 'heading_2':
      return (
        <h2 id={`id${id}`} style={{ backgroundColor: blockColor }}>
          <TextBlock text={value.rich_text} />
        </h2>
      )
    case 'heading_3':
      return (
        <h3 id={`id${id}`} style={{ backgroundColor: blockColor }}>
          <TextBlock text={value.rich_text} />
        </h3>
      )
    case 'bulleted_list_item':
    case 'numbered_list_item':
      return (
        <li style={{ backgroundColor: blockColor }}>
          <TextBlock text={value.rich_text} />
          {!!value.children && renderNestedList(block)}
        </li>
      )
    case 'to_do':
      return (
        <div style={{ backgroundColor: blockColor }}>
          <label htmlFor={id}>
            <input type="checkbox" id={id} defaultChecked={value.checked} />{' '}
            <TextBlock text={value.rich_text} />
          </label>
        </div>
      )
    case 'toggle':
      return (
        <details style={{ backgroundColor: blockColor }}>
          <summary>
            <TextBlock text={value.rich_text} />
          </summary>
          {value.children?.map((block) => (
            <Fragment key={block.id}>{renderBlock(block)}</Fragment>
          ))}
        </details>
      )
    case 'child_page':
      return <p style={{ backgroundColor: blockColor }}>{value.title}</p>
    case 'image': {
      const caption = value.caption ? value.caption[0]?.plain_text : ''
      const src = value.type === 'external' ? value.external.url : value.file.url
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={caption} />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )
    }
    case 'video': {
      const video_src = value.type === 'external' ? value.external.url : value.file.url
      const video_caption = value.caption ? value.caption[0]?.plain_text : ''
      if (value.type === 'external') {
        return (
          <div>
            <div
              style={{
                position: 'relative',
                paddingTop: '56.25%',
                marginTop: '1rem',
                marginBottom: '0rem',
              }}
            >
              <ReactPlayer
                url={video_src}
                controls={true}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
              />
            </div>
            {video_caption && <Text>{video_caption}</Text>}
          </div>
        )
      } else {
        return (
          <div>
            <div
              style={{
                position: 'relative',
                paddingTop: '56.25%',
                marginTop: '1rem',
                marginBottom: '0rem',
              }}
            >
              <video
                src={video_src}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                controls={true}
              />
            </div>
            {video_caption && <Text>{video_caption}</Text>}
          </div>
        )
      }
    }
    case 'divider':
      return <hr key={id} />
    case 'quote':
      return (
        <blockquote style={{ backgroundColor: blockColor }} key={id}>
          {value.rich_text[0].plain_text}
        </blockquote>
      )
    case 'code': {
      const codeCaption = value.caption ? value.caption[0]?.plain_text : ''
      if (value.language === 'plain text') {
        return (
          <figure>
            <figcaption>&quotraw&quot</figcaption>
            <Code color="blue" block key={id}>
              {value.rich_text[0].plain_text}
            </Code>
            {codeCaption && <figcaption>{codeCaption}</figcaption>}
          </figure>
        )
      } else {
        return (
          <figure>
            <figcaption>{value.language}</figcaption>
            <Prism color="blue" language={value.language}>
              {value.rich_text.length > 0
                ? value.rich_text[0][value.rich_text[0].type].content
                : '// no code entered here'}
            </Prism>
            {codeCaption && <figcaption>{codeCaption}</figcaption>}
          </figure>
        )
      }
    }
    case 'file': {
      const src_file = value.type === 'external' ? value.external.url : value.file.url
      const splitSourceArray = src_file.split('/')
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1]
      const caption_file = value.caption ? value.caption[0]?.plain_text : ''
      return (
        <figure>
          <div className={styles.file}>
            📎{' '}
            <Link href={src_file} passHref>
              {lastElementInArray.split('?')[0]}
            </Link>
          </div>
          {caption_file && <figcaption>{caption_file}</figcaption>}
        </figure>
      )
    }
    case 'bookmark': {
      // @TODO add in Puppetier function to create social card instead of just url
      const href = value.url
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.bookmark}>
          {href}
        </a>
      )
    }
    default:
      return `❌ Unsupported block (${type === 'unsupported' ? 'unsupported by Notion API' : type})`
  }
}

// export function Post({ page, blocks, links, code }) {
//   const { classes } = useStyles()
//   if (!page || !blocks) {
//     return <div />
//   }
//
//   return (
//     <div>
//       <Head>
//         <title>{page.properties.title.title[0].plain_text}</title>
//         <link rel="icon" href="/favicon.ico" />
//       </Head>
//
//       <article className={styles.container}>
//         <div
//           className={classes.wrapper}
//           style={{
//             backgroundImage: `url(${
//               page.cover
//                 ? page.cover[page.cover.type].url
//                 : 'https://images.unsplash.com/photo-1508614999368-9260051292e5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
//             })`,
//           }}
//         >
//           <Overlay color="#000" opacity={0.65} zIndex={1} />
//           <div className={classes.inner}>
//             <Title className={classes.title}>{page.properties.title.title[0]['plain_text']}</Title>
//             {/*<Container size={640}>*/}
//             {/*  <Text size='lg' className={classes.description}>*/}
//             {/*    {page.properties.Description.rich_text[0]['plain_text']}*/}
//             {/*  </Text>*/}
//             {/*</Container>*/}
//           </div>
//         </div>
//         <section>
//           {/*  <TableOfContents links={links} />*/}
//           {/*{blocks.map((block) => (*/}
//           {/*  <Fragment key={block.id}>{renderBlock(block)}</Fragment>*/}
//           {/*))}*/}
//           code
//           <Link href="/" className={styles.back}>
//             ← Go home
//           </Link>
//         </section>
//       </article>
//     </div>
//   )
// }

export const getStaticPaths = async () => {
  const posts = await getPosts(process.env.NOTION_DATABASE_ID, -1)
  const paths = posts?.map((page) => ({ params: { id: page.id.replace(/-/g, '') } }))
  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = async (context) => {
  const { id } = context.params
  const page = await getPage(id)
  const blocks = await getBlocks(id)

  // Retrieve block children for nested blocks (one level deep), for example toggle blocks
  // https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
  const childBlocks = await Promise.all(
    blocks
      .filter((block) => block.has_children)
      .map(async (block) => {
        return {
          id: block.id,
          children: await getBlocks(block.id),
        }
      })
  )
  const blocksWithChildren = blocks.map((block) => {
    // Add child blocks if the block should contain children but none exists
    if (block.has_children && !block[block.type].children) {
      block[block.type]['children'] = childBlocks.find((x) => x.id === block.id)?.children
    }
    return block
  })

  // interface tocHeadingProps {
  //   links: { label: string link: string order: number }[]
  // }

  const getLinks = (blocksWithChildren) => {
    const links = []

    blocksWithChildren.map((block) => {
      const { type, id } = block
      const value = block[type]
      let linkObj
      if (type === 'heading_1' || type === 'heading_2' || type === 'heading_3') {
        linkObj = {
          label: value.rich_text[0].text.content,
          link: `#id${id}`,
          order: Number(type.substr(-1)),
        }
        links.push(linkObj)
      }
    })
    return links
  }

  const tocLinks = getLinks(blocksWithChildren)
  // blocksWithChildren.map((block) => <Fragment key={block.id}>{renderBlock(block)}</Fragment>)
  let code = blocksWithChildren.map((block, index) =>
    renderToString(
      <Fragment key={block.id}>
        {renderBlock(block)}
        {index > 0 && <br />}
      </Fragment>
    )
  )
  // const { source, frontmatter, errors } = await bundleMDXFromSource(
  //   Buffer.from(code, 'utf8'),
  //   tocLinks
  // )
  // console.log('FINISHEDBUNDLE')
  page.properties['readingTime'] = readingTime(code)
  return {
    props: {
      page,
      blocks: blocksWithChildren,
      links: tocLinks,
      code: code,
    },
    revalidate: 1,
  }
}
