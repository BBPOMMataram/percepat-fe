"use client"
import React from 'react';
import styled, { CSSProperties } from 'styled-components';

const ColorPallet = ({ onColorClick }: { onColorClick: (particleColor: string) => void }) => {
    const colors = [
        '#e11d48', '#f472b6', '#fb923c', '#facc15', '#84cc16',
        '#10b981', '#0ea5e9', '#3b82f6', '#8b5cf6', '#a78bfa'
    ];

    return (
        <StyledWrapper>
            <div className="container-items">
                {colors.map((color, idx) => (
                    <button
                        key={idx}
                        className="item-color"
                        style={{ '--color': color } as CSSProperties}
                        data-color={color}
                        onClick={() => onColorClick(color)}
                    />
                ))}
            </div>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .container-items {
    display: flex;
    transform-style: preserve-3d;
    transform: perspective(1000px);
  }

  .item-color {
    position: relative;
    flex-shrink: 0;
    width: 32px;
    height: 40px;
    border: none;
    outline: none;
    transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
    cursor: pointer;

    &::after {
      position: absolute;
      content: "";
      inset: 0;
      width: 40px;
      height: 40px;
      background-color: var(--color);
      border-radius: 6px;
      transform: scale(1.2);
      pointer-events: none;
      transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
    }

    &::before {
      position: absolute;
      content: attr(data-color);
      left: 65%;
      bottom: 52px;
      font-size: 8px;
      line-height: 12px;
      transform: translateX(-50%);
      padding: 2px 0.25rem;
      background-color: #ffffff;
      border-radius: 6px;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.1);
    }

    &:hover {
      transform: scale(1.5);
      z-index: 99999;

      &::before {
        opacity: 1;
        visibility: visible;
      }
    }

    &:active::after {
      transform: scale(1.1);
    }

    &:focus::before {
      content: "✅Copy";
    }
  }

  /* Kamu bisa hapus bagian ini kalau tidak pakai :has() */
  /* Karena tidak semua browser mendukung :has */
`;

export default ColorPallet;
