import { useContext } from "react";
import { Ctx } from "./theme.storage";

export const useTheme = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used with in ThemeProvider");
  return ctx;
};

export default useTheme;
