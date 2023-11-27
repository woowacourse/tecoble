import React from 'react';

import styled from '@emotion/styled';

import type { Author } from '../templates/post';
import { AuthorListItem } from './AuthorListItem';

type AuthorListProps = {
  tooltip: 'small' | 'large';
  authors: Author[];
};

export function AuthorList(props: AuthorListProps) {
  return (
    <AuthorListUl className="author-list">
      {props.authors.map(author => (
        <AuthorListItem key={author.name} author={author} tooltip={props.tooltip} />
      ))}
    </AuthorListUl>
  );
}

export const AuthorListUl = styled.ul`
  display: flex;
  flex-wrap: wrap;
  margin: 0 0 0 4px;
  padding: 0;
  list-style: none;
`;
