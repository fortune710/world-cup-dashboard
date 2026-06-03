import * as React from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Link } from "react-router"
import {
  TrophyIcon,
  MenuIcon,
  Settings2Icon,
  CircleHelpIcon,
  RadioIcon,
  UsersIcon,
  UserIcon,
  ListTreeIcon
} from "lucide-react"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const mainLinks = React.useMemo(() => [
    { label: t("nav.live"), path: "/", end: true, icon: <RadioIcon className="size-4" /> },
    { label: t("nav.teams"), path: "/teams", icon: <UsersIcon className="size-4" /> },
    { label: t("nav.players"), path: "/players", icon: <UserIcon className="size-4" /> },
    { label: t("nav.matches"), path: "/matches", icon: <TrophyIcon className="size-4" /> },
    { label: t("nav.bracket"), path: "/bracket", icon: <ListTreeIcon className="size-4" /> },
  ], [t])

  const secondaryLinks = React.useMemo(() => [
    { label: t("nav.settings"), path: "/settings", icon: <Settings2Icon className="size-4" /> },
    { label: t("nav.getHelp"), path: "/help", icon: <CircleHelpIcon className="size-4" /> },
  ], [t])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6">

        {/* Left Side: Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-heading text-lg font-black tracking-tight text-foreground transition-transform hover:scale-[1.02]"
        >
          <TrophyIcon className="size-5 text-primary" />
          <span>{t("app.title")}</span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {mainLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "font-heading text-xs font-bold tracking-[0.2em] uppercase transition-colors relative py-1",
                  isActive
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Side: Desktop Controls & Mobile Drawer Trigger */}
        <div className="flex items-center gap-3">

          {/* Desktop Secondary Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center p-2 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-accent",
                  isActive && "text-primary"
                )
              }
              aria-label={t("nav.settings")}
            >
              <Settings2Icon className="size-4" />
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center p-2 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-accent",
                  isActive && "text-primary"
                )
              }
              aria-label={t("nav.getHelp")}
            >
              <CircleHelpIcon className="size-4" />
            </NavLink>
          </div>



          {/* Desktop Language Switcher and Theme Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile Language Switcher, Theme Toggle & Drawer */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open menu"
                  className="size-9 rounded-none hover:bg-muted"
                >
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] flex flex-col p-6">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2 font-heading text-lg font-black tracking-tight text-foreground">
                    <TrophyIcon className="size-5 text-primary" />
                    <span>{t("app.title")}</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-6 py-4">

                  {/* Primary Mobile Navigation */}
                  <nav className="flex flex-col gap-2">
                    {mainLinks.map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-semibold transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )
                        }
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </NavLink>
                    ))}
                  </nav>

                  <Separator />

                  {/* Secondary Mobile Navigation */}
                  <nav className="flex flex-col gap-2">
                    {secondaryLinks.map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-semibold transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )
                        }
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </NavLink>
                    ))}
                  </nav>

                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>
    </header>
  )
}
