import styled from 'styled-components';

const SimandalikaText = () => {
  return (
    <StyledWrapper>
      <a href="#" className="btn-shine">SI MANDALIKA</a>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: inline-block;

  .btn-shine {
    display: inline-block;
    padding: 6px 0;
    color: #fff;
    background: linear-gradient(to right, #9f9f9f 0, #fff 10%, #868686 20%);
    background-position: 0;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 5s infinite linear;
    animation-fill-mode: forwards;
    -webkit-text-size-adjust: none;
    font-weight: 700;
    font-size: 40px;
    line-height: 1.1;
    text-decoration: none;
    white-space: nowrap;
    font-family: sans-serif;
  }
  @-moz-keyframes shine {
    0% {
      background-position: 0;
    }
    60% {
      background-position: 395px;
    }
    100% {
      background-position: 395px;
    }
  }
  @-webkit-keyframes shine {
    0% {
      background-position: 0;
    }
    60% {
      background-position: 395px;
    }
    100% {
      background-position: 395px;
    }
  }
  @-o-keyframes shine {
    0% {
      background-position: 0;
    }
    60% {
      background-position: 395px;
    }
    100% {
      background-position: 395px;
    }
  }
  @keyframes shine {
    0% {
      background-position: 0;
    }
    60% {
      background-position: 395px;
    }
    100% {
      background-position: 395px;
    }
  }`;

export default SimandalikaText;
