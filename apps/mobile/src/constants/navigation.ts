import { LucideIcon } from "lucide-react-native"
import { Home, Shield, Compass, MessageCircle, Settings } from "lucide-react-native"

export type TabRoute = {
  name: string
  title: string
  icon: LucideIcon
}

export const tabRoutes: TabRoute[] = [
  { name: "(tabs)/index", title: "Home", icon: Home },
  { name: "(tabs)/invest", title: "Invest", icon: Shield },
  { name: "(tabs)/explore", title: "Explore", icon: Compass },
  { name: "(tabs)/advisor", title: "Advisor", icon: MessageCircle },
  { name: "(tabs)/settings", title: "Settings", icon: Settings },
]

