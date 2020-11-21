import { Link } from 'gatsby';
import React from 'react';
import { lighten } from 'polished';
import styled from '@emotion/styled';
import * as _ from 'lodash';

import { colors } from '../styles/colors';
import { format } from 'date-fns';

export interface ReadNextProps {
  tags: string[];
  currentPageSlug: string;
  relatedPosts: {
    totalCount: number;
    edges: Array<{
      node: {
        timeToRead: number;
        frontmatter: {
          title: string;
          date: string;
        };
        fields: {
          slug: string;
        };
      };
    }>;
  };
}

export const ReadNextCard: React.FC<ReadNextProps> = props => {
  // filter out current post and limit to 3 related posts
  const relatedPosts = props.relatedPosts.edges.filter(post => post.node.fields.slug !== props.currentPageSlug).slice(0, 3);

  return (
    <ReadNextCardArticle className="read-next-card">
      <header className="read-next-card-header">
        <ReadNextCardHeaderTitle>
          <span>More in</span>{' '}
          <Link to={`/tags/${_.kebabCase(props.tags[0])}/`}>{props.tags[0]}</Link>
        </ReadNextCardHeaderTitle>
      </header>
      <ReadNextCardContent className="read-next-card-content">
        <ul>
          {relatedPosts.map(n => {
            const date = new Date(n.node.frontmatter.date);
            // 2018-08-20
            const datetime = format(date, 'yyyy-MM-dd');
            // 20 AUG 2018
            const displayDatetime = format(date, 'dd LLL yyyy');
            return (
              <li key={n.node.frontmatter.title}>
                <h4>
                  <Link to={n.node.fields.slug}>{n.node.frontmatter.title}</Link>
                </h4>
                <ReadNextCardMeta className="read-next-card-meta">
                  <p>
                    <time dateTime={datetime}>{displayDatetime}</time> - {n.node.timeToRead} min
                    read
                  </p>
                </ReadNextCardMeta>
              </li>
            );
          })}
        </ul>
      </ReadNextCardContent>
      <ReadNextCardFooter className="read-next-card-footer">
        <Link to={`/tags/${_.kebabCase(props.tags[0])}/`}>
          {props.relatedPosts.totalCount > 1 && `See all ${props.relatedPosts.totalCount} posts`}
          {props.relatedPosts.totalCount === 1 && '1 post'}
          {props.relatedPosts.totalCount === 0 && 'No posts'} →
        </Link>
      </ReadNextCardFooter>
    </ReadNextCardArticle>
  );
};

const ReadNextCardArticle = styled.article`
  position: relative;
  flex: 0 1 326px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0 25px 50px;
  padding: 25px;
  /* background: linear-gradient(
    color(var(--darkgrey) l(+2%)),
    color(var(--darkgrey) l(-5%))
  ); */
  background: linear-gradient(
    ${lighten('0.02', colors.darkgrey)},
    ${lighten('-0.05', colors.darkgrey)}
  );
  border-radius: 3px;

  a {
    transition: all 0.2s ease-in-out;
  }

  a:hover {
    text-decoration: none;
  }

  @media (max-width: 1170px) {
    flex: 1 1 261px;
    margin-bottom: 5vw;
  }

  @media (max-width: 650px) {
    flex: 1 1 auto;
    margin: 0 25px;
    padding: 0;
    background: none;
  }
`;

const ReadNextCardHeaderTitle = styled.h3`
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
  line-height: 1em;
  font-weight: 300;
  letter-spacing: 0.4px;
  text-transform: uppercase;

  a {
    color: #fff;
    font-weight: 500;
    text-decoration: none;
    opacity: 0.8;
  }

  a:hover {
    opacity: 1;
  }
`;

const ReadNextCardContent = styled.div`
  font-size: 1.7rem;

  ul {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0;
    padding: 20px 0;
    border-bottom: rgba(255, 255, 255, 0.1);
  }

  li:last-of-type {
    padding-bottom: 5px;
    border: none;
  }

  h4 {
    margin: 0;
    font-size: 1.6rem;
    line-height: 1.35em;
    font-weight: 600;
  }

  li a {
    display: block;
    color: #fff;
    opacity: 0.8;
  }

  li a:hover {
    opacity: 1;
  }
`;

const ReadNextCardMeta = styled.div`
  margin-top: 2px;
  font-size: 1.2rem;
  line-height: 1.4em;
  font-weight: 400;

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
  }
`;

const ReadNextCardFooter = styled.footer`
  position: relative;
  margin: 40px 0 5px;

  a {
    padding: 7px 12px 8px 14px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.3rem;
    border-radius: 999px;
    transition: all 0.35s ease-in-out;
  }

  a:hover {
    /* border-color: var(--yellow); */
    border-color: ${colors.yellow};
    color: ${colors.yellow};
    text-decoration: none;
  }
`;
