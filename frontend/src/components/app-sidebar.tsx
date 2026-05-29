import * as React from "react"
import { Link } from "react-router"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  RadioIcon,
  SearchIcon,
  Settings2Icon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Live",
      url: "/",
      end: true,
      icon: <RadioIcon />,
    },
    {
      title: "Teams",
      url: "/teams",
      icon: <UsersIcon />,
    },
    {
      title: "Players",
      url: "/players",
      icon: <UserIcon />,
    },
    {
      title: "Matches",
      url: "/matches",
      icon: <TrophyIcon />,
    },
    {
      title: "Bracket",
      url: "/bracket",
      icon: <ListTreeIcon />,
    },  
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <SearchIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <FileChartColumnIcon
        />
      ),
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: (
        <FileIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <span className="text-base font-semibold">WC26</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
     <SidebarFooter>
     <NavSecondary items={data.navSecondary} className="mt-auto" />
     </SidebarFooter>
    </Sidebar>
  )
}
