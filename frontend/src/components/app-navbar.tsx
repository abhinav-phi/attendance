import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";

import { ThemeSwitch } from "@/components/theme-switch";

interface NavbarProps {
  username?: string;
}

export const AppNavbar = ({ username }: NavbarProps) => {
  return (
    <HeroUINavbar
      classNames={{
        base: "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-[#e0e0e0] dark:border-[#2a2a2c]",
        wrapper: "px-4 sm:px-8",
      }}
      height="52px"
      maxWidth="xl"
      position="sticky"
    >
      <NavbarBrand>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#1d1d1f] dark:bg-white flex items-center justify-center text-white dark:text-black font-semibold text-[17px]">
            p
          </div>
          <p className="font-semibold text-[21px] tracking-[-0.02em] text-[#1d1d1f] dark:text-white">
            present
          </p>
        </div>
      </NavbarBrand>

      <NavbarContent className="gap-4" justify="end">
        {username && (
          <NavbarItem className="hidden sm:flex">
            <p className="text-[14px] text-[#1d1d1f] dark:text-white">
              {username}
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
