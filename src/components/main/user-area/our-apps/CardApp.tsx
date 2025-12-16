import { AppData } from '@/types/app-data';
import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';

const CardApp = ({ appData, isAdmin }: { appData: AppData, isAdmin?: boolean }) => {
  return (
    <StyledWrapper>
      <div className="card card-5">
        <div className="card__icon max-w-10/12 uppercase">
          {appData.name}
        </div>
        <p className="card__exit">
          <Image
            className='w-12 h-12 rounded-full'
            alt={appData.name}
            width={50}
            height={50}
            src={appData.logo_path ?? '/assets/images/noimage.svg'}
          />
        </p>
        <div className="text">{appData.desc}</div>
        <p className="card__apply">
          {
            // JIKA URL EXTERNAL MAKA GUNAKAN ANCHOR
            // Jika link mengandung 'http', berarti itu adalah link eksternal
            // Jika tidak, gunakan Link dari Next.js untuk navigasi internal
            appData.link.includes('http') ? (
              <a className="card__link" href={appData.link} target="_blank" rel="noopener noreferrer">Visit Now <i className="fas fa-arrow-right" /></a>
            ) : (

              isAdmin ? (
                <Link href={`/admin/${appData.link}`}>
                  <span className="card__link">Visit Admin panel <i className="fas fa-arrow-right" /></span>
                </Link>
              )
                :
                <Link href={appData.link}>
                  <span className="card__link">Visit Now <i className="fas fa-arrow-right" /></span>
                </Link>
            )
          }
        </p>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    margin: 20px;
    padding: 20px;
    max-width: 300px;
    min-height: 200px;
    display: grid;
    grid-template-rows: 20px 50px 1fr 50px;
    border-radius: 10px;
    box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.25);
    transition: all 0.2s;
  }

  .card:hover {
    box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.4);
    transform: scale(1.01);
  }

  .card__link,
  .card__exit,
  .card__icon {
    position: relative;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.9);
  }

  .card__link::after {
    position: absolute;
    top: 25px;
    left: 0;
    content: "";
    width: 0%;
    height: 3px;
    background-color: rgba(255, 255, 255, 0.6);
    transition: all 0.5s;
  }

  .card__link:hover::after {
    width: 100%;
  }

  .text {
    color: white;
  }

  .card__exit {
    grid-row: 1/2;
    justify-self: end;
  }

  .card__icon {
    grid-row: 2/3;
    font-size: 1.5rem;
  }

  .card__title {
    grid-row: 3/4;
    font-weight: 400;
    color: #ffffff;
  }

  .card__apply {
    grid-row: 4/5;
    align-self: center;
  }

  .card-5 {
    background: radial-gradient(#f588d8, #c0a3e5);
  }

  @media (max-width: 1600px) {
    .cards {
      justify-content: center;
    }
  }`;

export default CardApp;
