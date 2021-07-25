import React from 'react';

import styled from '@emotion/styled';

import { Author } from '../templates/post';
import { AuthorListItem } from './AuthorListItem';

interface AuthorListProps {
  tooltip: 'small' | 'large';
  authors: Author[];
}

export const AuthorList = ({ authors, tooltip }: AuthorListProps) => (
  <AuthorListUl className="author-list">
    {authors.map(author => (
      <AuthorListItem key={author.id} author={author} tooltip={tooltip} />
    ))}
  </AuthorListUl>
);

export const AuthorListUl = styled.ul`
  display: flex;
  flex-wrap: wrap;
  margin: 0 0 0 4px;
  padding: 0;
  list-style: none;
`;
