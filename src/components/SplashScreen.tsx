"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import icon from "@/app/iconwithtext.png";

export default function SplashScreen({
  finishLoading,
  time,
}: {
  finishLoading: () => void;
  time: number;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const loadingTime = time * 1000;

  useEffect(() => {
    setIsMounted(true);

    const timeout = setTimeout(() => {
      finishLoading();
    }, loadingTime);

    return () => clearTimeout(timeout);
  }, [finishLoading]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-primary transition-opacity duration-500 ${isMounted ? "opacity-100" : "opacity-0"}`}
    >
      <div className="text-center">
        <div className="w-50 h-50 rounded-2xl flex items-center justify-center">
          <Image src={icon} alt="Icon TapVern" />
        </div>
      </div>
    </div>
  );
}
