import React from 'react';
import styled from '@emotion/styled';

interface WrapperProps {
  children: React.ReactElement | React.ReactElement[];
  className?: string;
}

export const Wrapper = ({ children, className }: WrapperProps) => (
  <StyledWrapper className={className}>{children}</StyledWrapper>
);

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;
