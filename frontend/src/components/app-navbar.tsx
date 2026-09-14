import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { motion } from "framer-motion";

import { ThemeSwitch } from "@/components/theme-switch";

interface NavbarProps {
  username?: string;
}

export const AppNavbar = ({ username }: NavbarProps) => {
  return (
    <HeroUINavbar
      classNames={{
        base: "bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-default-100",
        wrapper: "px-4 sm:px-8",
      }}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarBrand>
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            p
          </div>
          <p className="font-bold text-inherit text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            present
          </p>
        </motion.div>
      </NavbarBrand>

      <NavbarContent className="gap-4" justify="end">
        {username && (
          <NavbarItem className="hidden sm:flex">
            <p className="text-sm font-medium text-default-500">
              Hi, <span className="text-primary font-bold">{username}</span>
            </p>
          </NavbarItem>
        )}
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
