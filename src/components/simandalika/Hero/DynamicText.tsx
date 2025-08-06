import React from 'react';
import styled from 'styled-components';

const DynamicText = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="loader flex">
          <p>BBPOM DI MATARAM</p>
          <div className="words ml-2 bg-[rgb(8,67,98)] rounded px-2">
            <span className="word">PROFESIONAL</span>
            <span className="word">INOVATIF</span>
            <span className="word">RESPONSIF</span>
            <span className="word">BERINTEGRITAS</span>
            <span className="word">PROFESIONAL</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    /* color used to softly clip top and bottom of the .words container */
    --bg-color: transparent;
    background-color: var(--bg-color);
    // padding: 1rem 2rem;
    border-radius: 1.25rem;
  }
  .loader {
    color: rgb(8,67,138);
    font-family: "Poppins", sans-serif;
    font-weight: 600;
    font-size: 25px;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    height: 40px;
    padding: 10px 10px;
    border-radius: 8px;
  }

  .words {
    overflow: hidden;
    position: relative;
  }
  .words::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      var(--bg-color) 10%,
      transparent 30%,
      transparent 70%,
      var(--bg-color) 90%
    );
    z-index: 20;
  }

  .word {
    display: block;
    height: 100%;
    color: rgb(0,201,81);
    animation: spin_4991 4s infinite;
  }

  @keyframes spin_4991 {
    10% {
      -webkit-transform: translateY(-102%);
      transform: translateY(-102%);
    }

    25% {
      -webkit-transform: translateY(-100%);
      transform: translateY(-100%);
    }

    35% {
      -webkit-transform: translateY(-202%);
      transform: translateY(-202%);
    }

    50% {
      -webkit-transform: translateY(-200%);
      transform: translateY(-200%);
    }

    60% {
      -webkit-transform: translateY(-302%);
      transform: translateY(-302%);
    }

    75% {
      -webkit-transform: translateY(-300%);
      transform: translateY(-300%);
    }

    85% {
      -webkit-transform: translateY(-402%);
      transform: translateY(-402%);
    }

    100% {
      -webkit-transform: translateY(-400%);
      transform: translateY(-400%);
    }
  }`;

export default DynamicText;
