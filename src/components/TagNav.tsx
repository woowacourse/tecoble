import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { graphql, Link, useStaticQuery } from 'gatsby';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { colors } from '../styles/colors';
import { inner } from '../styles/shared';
import ArrowDown from './icons/ArrowDown';
import ArrowUp from './icons/ArrowUp';

type TagNavQuery = {
  allMarkdownRemark: {
    edges: Array<{
      node: {
        frontmatter: {
          tags: string[];
        };
      };
    }>;
  };
};

type Tag = {
  name: string;
  count: number;
};

type Props = {
  className?: string;
};

function TagNav({ className }: Props) {
  const {
    allMarkdownRemark: { edges },
  } = useStaticQuery<TagNavQuery>(graphql`
    query TagNavQuery {
      allMarkdownRemark {
        edges {
          node {
            frontmatter {
              tags
            }
          }
        }
      }
    }
  `);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isWideView, setIsWideView] = useState(false);

  useEffect(() => {
    if (!edges) {
      return;
    }

    const tagNameMap: Record<string, Tag> = {};

    edges.forEach(edge => {
      edge.node.frontmatter.tags.forEach(tag => {
        const tagName = _.kebabCase(tag);

        if (!tagNameMap[tagName]) {
          tagNameMap[tagName] = {
            name: tagName,
            count: 1,
          };
          return;
        }

        tagNameMap[tagName].count += 1;
      });
    });

    const sortedTags = Object.values(tagNameMap).sort(({ name: aTagName }, { name: bTagName }) =>
      aTagName.toUpperCase() >= bTagName.toUpperCase() ? 1 : -1,
    );

    setTags(sortedTags);
  }, []);

  return (
    <TagNavWrapper className={className} isWideView={isWideView}>
      <ul>
        {tags.map(tag => (
          <li key={tag.name}>
            <Link to={`/tags/${tag.name}`}>{`#${tag.name} (${tag.count})`}</Link>
          </li>
        ))}
      </ul>
      <button type="button" className="view-more-button" onClick={() => setIsWideView(!isWideView)}>
        {isWideView ? (
          <span>
            <ArrowUp />
            접기
          </span>
        ) : (
          <span>
            <ArrowDown />
            더보기
          </span>
        )}
      </button>
    </TagNavWrapper>
  );
}

const wide = css`
  height: 130px;
  overflow-x: hidden;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const narrow = css`
  height: 40px;
`;

const TagNavWrapper = styled.div<{ isWideView: boolean }>`
  ${inner}

  display: flex;
  position: relative;
  transition: height 0.5s ease-in-out;

  ${({ isWideView }) => (isWideView ? wide : narrow)};
  font-size: 13px;

  & > .view-more-button {
    margin-top: 5px;
    min-width: 80px;
    height: 30px;
    background-color: rgba(0, 0, 0, 0);
    color: ${colors.midgrey};

    & span {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  & > ul {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    padding: 0;
  }

  & li {
    list-style: none;
    display: inline-block;
    border-radius: 20px;
    padding: 2px 5px;
    margin-left: 7px;

    background-color: ${colors.midgrey};

    & > a {
      color: white;
    }
  }
`;

export default TagNav;
