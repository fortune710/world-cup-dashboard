import * as React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { ListTreeIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  CircleHelpIcon,
  RadioIcon,
  SearchIcon,
  Settings2Icon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()

  const navMain = React.useMemo(
    () => [
      {
        title: t("nav.live"),
        url: "/",
        end: true,
        icon: <RadioIcon />,
      },
      {
        title: t("nav.teams"),
        url: "/teams",
        icon: <UsersIcon />,
      },
      {
        title: t("nav.players"),
        url: "/players",
        icon: <UserIcon />,
      },
      {
        title: t("nav.matches"),
        url: "/matches",
        icon: <TrophyIcon />,
      },
      {
        title: t("nav.bracket"),
        url: "/bracket",
        icon: <ListTreeIcon />,
      },
    ],
    [t]
  )

  const navSecondary = React.useMemo(
    () => [
      {
        title: t("nav.settings"),
        url: "/settings",
        icon: <Settings2Icon />,
      },
      {
        title: t("nav.getHelp"),
        url: "/help",
        icon: <CircleHelpIcon />,
      },
      {
        title: t("nav.search"),
        url: "#",
        icon: <SearchIcon />,
      },
    ],
    [t]
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/">
                <TrophyIcon className="size-5!" />
                <span className="text-base font-semibold">{t("app.title")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarFooter>
    </Sidebar>
  )
}
