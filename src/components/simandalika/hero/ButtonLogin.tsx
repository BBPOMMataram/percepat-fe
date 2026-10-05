/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser, logout } from "@/features/authSlice";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const ButtonLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    window.location.reload();
  };

  if (loading) {
    return null;
  }

  return (
    <StyledWrapper>
      {user ? (
        <div className="user-profile-box">
          <span className="user-name text-lg font-bold">Hai, {user.call_name}</span>
          <button onClick={handleLogout} className="logout-button" type="button">
            Logout
          </button>
        </div>
      ) : (
        <div className="container-button" onClick={() => router.push("/login")}>
          <div className="hover bt-1" />
          <div className="hover bt-2" />
          <div className="hover bt-3" />
          <div className="hover bt-4" />
          <div className="hover bt-5" />
          <div className="hover bt-6" />
          <button type="button" className="login-btn-core" />
        </div>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  .user-profile-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 160px;
  }

  .user-name {
    // font-size: 13px;
    // font-weight: 800;
    color: #004281;
    text-align: center;
    width: 100%;
    word-break: break-word;
    white-space: normal;
    line-height: 1.2;
  }

  .logout-button {
    padding: 0;
    width: 135px;
    height: 47px;
    background: #004281;
    font-size: 15px;
    font-weight: 900;
    color: #ffffff;
    border: 3px solid #004281;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 4px 6px rgba(0, 66, 129, 0.2);

    &:hover {
      background: #002d59;
      transform: translateY(-2px);
      box-shadow: 0 6px 10px rgba(0, 66, 129, 0.3);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .container-button {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas: "bt-1 bt-2 bt-3"
      "bt-4 bt-5 bt-6";
    position: relative;
    perspective: 800px;
    padding: 0;
    width: 135px;
    height: 47px;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
  }

  .container-button:active {
    transform: scale(0.95);
  }

  .hover {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 200;
  }

  .bt-1 { grid-area: bt-1; }
  .bt-2 { grid-area: bt-2; }
  .bt-3 { grid-area: bt-3; }
  .bt-4 { grid-area: bt-4; }
  .bt-5 { grid-area: bt-5; }
  .bt-6 { grid-area: bt-6; }

  .bt-1:hover ~ .login-btn-core {
    transform: rotateX(15deg) rotateY(-15deg) rotateZ(0deg);
    box-shadow: -2px -2px #18181888;
  }

  .bt-1:hover ~ .login-btn-core::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: -2px -2px #18181888;
  }

  .bt-3:hover ~ .login-btn-core {
    transform: rotateX(15deg) rotateY(15deg) rotateZ(0deg);
    box-shadow: 2px -2px #18181888;
  }

  .bt-3:hover ~ .login-btn-core::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: 2px -2px #18181888;
  }

  .bt-4:hover ~ .login-btn-core {
    transform: rotateX(-15deg) rotateY(-15deg) rotateZ(0deg);
    box-shadow: -2px 2px #18181888;
  }

  .bt-4:hover ~ .login-btn-core::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: -2px 2px #18181888;
  }

  .bt-6:hover ~ .login-btn-core {
    transform: rotateX(-15deg) rotateY(15deg) rotateZ(0deg);
    box-shadow: 2px 2px #18181888;
  }

  .bt-6:hover ~ .login-btn-core::after {
    animation: shake 0.5s ease-in-out 0.3s;
    text-shadow: 2px 2px #18181888;
  }

  .hover:hover ~ .login-btn-core::before {
    background: transparent;
  }

  .hover:hover ~ .login-btn-core::after {
    content: "Click";
    top: -110%;
    transform: translate(-50%, 0);
    font-size: 34px;
    color: #004281;
  }

  .login-btn-core {
    position: absolute;
    padding: 0;
    width: 135px;
    height: 47px;
    background: transparent;
    font-size: 17px;
    font-weight: 900;
    border: 3px solid #004281ff;
    border-radius: 12px;
    transition: all 0.3s ease-in-out;
  }

  .login-btn-core::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 135px;
    height: 47px;
    background-color: #004281ee;
    border-radius: 12px;
    transition: all 0.3s ease-in-out;
    z-index: -1;
  }

  .login-btn-core::after {
    content: "Masuk";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 135px;
    height: 47px;
    background-color: transparent;
    font-size: 17px;
    font-weight: 900;
    line-height: 47px;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    transition: all 0.3s ease-in-out;
    z-index: 2;
  }

  @keyframes shake {
    0% { left: 45%; }
    25% { left: 54%; }
    50% { left: 48%; }
    75% { left: 52%; }
    100% { left: 50%; }
  }
`;

export default ButtonLogin;