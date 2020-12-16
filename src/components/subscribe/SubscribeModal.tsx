import React from 'react';
import styled from '@emotion/styled';

import { colors } from '../../styles/colors';
import config from '../../website-config';
import { SubscribeForm } from './SubscribeForm';
import SubscribeLogo from './SubscribeLogo';

interface SubscribeState {
  isOpen: boolean;
}

export class SubscribeModal extends React.Component<any, SubscribeState> {
  state = { isOpen: false };

  componentWillUnmount() {
    this.unsubscribeEsc();
  }

  escFunction = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.close();
    }
  };

  subscribeEsc() {
    document.addEventListener('keydown', this.escFunction, false);
  }

  unsubscribeEsc() {
    document.removeEventListener('keydown', this.escFunction, false);
  }

  open = () => {
    this.setState({ isOpen: true });
    this.subscribeEsc();
  };

  close = () => {
    this.setState({ isOpen: false });
    this.unsubscribeEsc();
  };

  render() {
    return (
      <SubscribeOverlay open={this.state.isOpen}>
        <SubscribeOverlayClose onClick={this.close} />
        <SubscribeOverlayContent>
          <SubscribeLogo />
          <SubscribeOverlayTitle>Subscribe to {config.title}</SubscribeOverlayTitle>
          <SubscribeOverlayDescription>
            Stay up to date! Get all the latest &amp; greatest posts delivered straight to your
            inbox
          </SubscribeOverlayDescription>
          <SubscribeForm />
        </SubscribeOverlayContent>
      </SubscribeOverlay>
    );
  }
}

interface SubscribeOverlayProps {
  open?: boolean;
}

const SubscribeOverlay = styled.div<SubscribeOverlayProps>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(9, 10, 11, 0.97);
  /* opacity: 0; */
  opacity: ${(props: SubscribeOverlayProps) => (props.open ? 1 : 0)};
  transition: opacity 0.2s ease-in;
  /* pointer-events: none; */
  pointer-events: ${(props: SubscribeOverlayProps) => (props.open ? 'auto' : 'none')};

  button {
    display: inline-block;
    margin: 0 0 0 15px;
    padding: 0 25px;
    height: 52px;
    outline: none;
    color: #fff;
    font-size: 1.7rem;
    line-height: 38px;
    font-weight: 400;
    text-align: center;
    /* background: linear-gradient(
      color(var(--blue) whiteness(+7%)),
      color(var(--blue) lightness(-7%) saturation(-10%)) 60%,
      color(var(--blue) lightness(-7%) saturation(-10%)) 90%,
      color(var(--blue) lightness(-4%) saturation(-10%))
    ); */
    background: linear-gradient(#4fb7f0, #29a0e0 60%, #29a0e0 90%, #36a6e2);
    border-radius: 8px;

    -webkit-font-smoothing: subpixel-antialiased;
  }

  form {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    max-width: 540px;
  }

  .form-group {
    flex-grow: 1;
  }

  .subscribe-email {
    display: block;
    padding: 14px 20px;
    width: 100%;
    border: none;
    color: ${colors.midgrey};
    font-size: 2rem;
    line-height: 1em;
    font-weight: normal;
    letter-spacing: 0.5px;
    user-select: text;
    border-radius: 8px;
    transition: border-color 0.15s linear;

    -webkit-appearance: none;
  }

  @media (max-width: 500px) {
    button {
      margin: 12px 0 0;
    }
  }
  @media (prefers-color-scheme: dark) {
    p {
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

const SubscribeOverlayClose = styled.a`
  position: absolute;
  top: 16px;
  right: 20px;
  z-index: 2000;
  display: block;
  width: 40px;
  height: 40px;

  :before {
    content: "";
    position: absolute;
    top: 20px;
    right: 4px;
    display: block;
    width: 32px;
    height: 1px;
    background: #fff;
    opacity: 0.8;
    transform: rotate(45deg);
  }

  :after {
    content: "";
    position: absolute;
    top: 20px;
    right: 4px;
    display: block;
    width: 32px;
    height: 1px;
    background: #fff;
    opacity: 0.8;
    transform: rotate(-45deg);
  }

  :hover {
    cursor: default;
  }
`;

const SubscribeOverlayContent = styled.div`
  position: relative;
  margin: 0 0 5vw 0;
  padding: 4vw;
  color: #fff;
  text-align: center;
`;

const SubscribeOverlayTitle = styled.h1`
  display: inline-block;
  margin: 0 0 10px 0;
  font-size: 5.2rem;
  line-height: 1.15em;
`;

const SubscribeOverlayDescription = styled.p`
  margin: 0 auto 50px;
  max-width: 650px;
  color: #fff;
  font-family: Georgia, serif;
  font-size: 2.4rem;
  line-height: 1.3em;
  font-weight: 300;
  opacity: 0.8;
`;
