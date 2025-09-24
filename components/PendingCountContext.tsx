import React, { createContext, useState } from "react";
export const PendingCountContext = createContext<{pendingCount: number, setPendingCount: (n: number) => void}>({pendingCount: 0, setPendingCount: () => {}});
export function PendingCountProvider({ children }: { children: React.ReactNode }) {
  
    const [pendingCount, setPendingCount] = useState(0);

  return (
    <PendingCountContext.Provider value={{ pendingCount, setPendingCount }}>
      {children}
    </PendingCountContext.Provider>
  );
}