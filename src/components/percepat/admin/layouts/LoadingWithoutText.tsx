"use client"
import Image from 'next/image';
import styled from 'styled-components';

// LOADING PAGE YANG TANPA "USE CLIENT"
const LoadingWithoutText = () => {
    return (
        <>
            <div className="flex flex-col items-center">
                <StyledWrapper>
                    <div className="logo-wrapper animate-pulse">
                        <Image src={"/assets/images/bpom.webp"} alt="Logo BPOM RI" width={100} height={100} className="mx-auto mb-2 logo" />
                    </div>
                </StyledWrapper>
            </div>
        </>
    );
}

const StyledWrapper = styled.div`
  /* Prior to using this loader, please ensure that you have set a background image or background color, as the text is transparent and not designed with a solid color. */
  display: flex;
  flex-direction: column;
  align-items: center;

  .logo-wrapper {
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }`;

export default LoadingWithoutText;
