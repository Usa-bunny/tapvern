"use client";

import { useState } from "react";
import SplashScreen from "@/components/SplashScreen";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading ? (
        <SplashScreen finishLoading={() => setIsLoading(false)} time={2}/>
      ) : (
        children
      )}
    </>
  );
}
