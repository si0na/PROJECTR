import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  Settings,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLES } from "@/lib/constants";
import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type NavbarProps = {
  onSidebarToggle: () => void;
  selectedPerson?: { userId: string; name: string; level: string } | null;
  setSelectedPerson?: (person: { userId: string; name: string; level: string }) => void;
};

const levelMap: Record<string, string> = {
  TOWER_HEAD: "DELIVERY_MANAGER",
  ORG_HEAD: "ORG_HEAD",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DELIVERY_MANAGER: "DELIVERY_MANAGER",
};

export function Navbar({ onSidebarToggle, selectedPerson, setSelectedPerson }: NavbarProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<
    { preferredName: string; role: string; userId: string }[]
  >([]);
  // Internal fallback if setSelectedPerson is not provided
  const [internalSelectedPerson, setInternalSelectedPerson] = useState<{ userId: string; name: string; level: string } | null>(null);

  // Use prop if provided, else fallback to internal state
  const effectiveSelectedPerson = selectedPerson ?? internalSelectedPerson;
  const effectiveSetSelectedPerson = setSelectedPerson ?? setInternalSelectedPerson;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return "Admin";
      case USER_ROLES.DELIVERY_MANAGER:
        return "Delivery Manager";
      case USER_ROLES.PROJECT_MANAGER:
        return "Project Manager";
      case "ORG_HEAD":
        return "Org Head";
      case "TOWER_HEAD":
        return "Tower Head";
      default:
        return role;
    }
  };

  useEffect(() => {
    fetch("http://34.63.198.88:8080/api/users")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data
          .filter((u: any) => u.preferredName && u.role)
          .map((u: any) => ({
            preferredName: u.preferredName,
            role: u.role,
            userId: u.userId,
          }));

        setUsers(filtered);

        if (filtered.length > 0 && !effectiveSelectedPerson) {
          const firstUser = filtered[0];
          effectiveSetSelectedPerson({
            userId: firstUser.userId,
            name: firstUser.preferredName,
            level: levelMap[firstUser.role] || firstUser.role,
          });
        }
      })
      .catch((err) => console.error("Error fetching users", err));
  }, [effectiveSetSelectedPerson, effectiveSelectedPerson]);

  const handleUserChange = (val: string) => {
    const foundUser = users.find((u) => u.userId === val);
    if (foundUser) {
      effectiveSetSelectedPerson({
        userId: foundUser.userId,
        name: foundUser.preferredName,
        level: levelMap[foundUser.role] || foundUser.role,
      });
    }
  };

  return (
    <nav className="bg-gradient-to-r from-[#393f43] to-[#2eb05a] border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: logo and sidebar toggle */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-gray-100/20 rounded-full"
              onClick={onSidebarToggle}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5 text-gray-100" />
            </Button>
            <div className="h-9 w-9 rounded-full overflow-hidden border border-[#ffffff20] bg-[#ffffff10] flex items-center justify-center">
              <img
                src="https://content.jdmagicbox.com/comp/thiruvananthapuram/p7/0471px471.x471.170928172410.h6p7/catalogue/reflections-info-systems-pvt-ltd-technopark-thiruvananthapuram-software-companies-o6303lmhw5.jpg"
                alt="Reflections Logo"
                className="object-cover h-full w-full"
                loading="eager"
              />
            </div>
            <span className="text-white font-medium text-lg hidden sm:block">
              Reflections
            </span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100/20 rounded-full text-gray-100"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-100/20 rounded-full text-gray-100"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-gray-100/20 rounded-full px-2 text-gray-100"
                >
                  <Avatar className="h-8 w-8 border border-[#ffffff30]">
                    <AvatarFallback className="bg-blue-400/80 text-white">
                      {(effectiveSelectedPerson?.name?.charAt(0).toUpperCase()) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex md:flex-col md:items-start">
                    <span className="text-sm font-medium">
                      {effectiveSelectedPerson?.name || "User"}
                    </span>
                    <span className="text-xs text-gray-200">
                      {getRoleDisplayName(effectiveSelectedPerson?.level || "")}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-64 rounded shadow-lg border border-gray-200 mt-2 bg-white"
                align="end"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {effectiveSelectedPerson?.name || "User"}
                  </p>
                  {/* Removed email display */}
                  <Badge
                    variant={
                      effectiveSelectedPerson?.level === USER_ROLES.ADMIN
                        ? "destructive"
                        : effectiveSelectedPerson?.level === USER_ROLES.DELIVERY_MANAGER
                        ? "default"
                        : effectiveSelectedPerson?.level === USER_ROLES.PROJECT_MANAGER
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs mt-1"
                  >
                    {getRoleDisplayName(effectiveSelectedPerson?.level || "")}
                  </Badge>
                </div>

                <DropdownMenuSeparator />

                <div className="px-3 py-2">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Assessed Person
                  </label>
                  <Select
                    value={effectiveSelectedPerson?.userId || ""}
                    onValueChange={handleUserChange}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="Select Person" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.userId} value={u.userId}>
                          {u.preferredName} ({getRoleDisplayName(u.role)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="w-full cursor-pointer text-gray-700"
                  >
                    <User className="mr-2 h-4 w-4 text-gray-600" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="w-full cursor-pointer text-gray-700"
                  >
                    <Settings className="mr-2 h-4 w-4 text-gray-600" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 cursor-pointer hover:bg-gray-100 rounded">
                  <LogOut className="mr-2 h-4 w-4 text-red-400" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}