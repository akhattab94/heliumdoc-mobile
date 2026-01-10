import { useState } from "react";
import { ScrollView, Text, View, Pressable, Switch, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface MenuItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  type: "navigate" | "toggle" | "action";
  value?: boolean;
}

const menuItems: MenuItem[] = [
  { id: "personal", icon: "person-outline", title: "Personal Information", subtitle: "Name, email, phone", type: "navigate" },
  { id: "medical", icon: "medkit-outline", title: "Medical History", subtitle: "Conditions, allergies, medications", type: "navigate" },
  { id: "insurance", icon: "card-outline", title: "Insurance Details", subtitle: "Insurance provider, policy number", type: "navigate" },
  { id: "appointments", icon: "calendar-outline", title: "My Appointments", subtitle: "View upcoming and past appointments", type: "navigate" },
  { id: "notifications", icon: "notifications-outline", title: "Notification Settings", subtitle: "Push, email, SMS preferences", type: "navigate" },
  { id: "language", icon: "language-outline", title: "Language", subtitle: "English", type: "navigate" },
  { id: "help", icon: "help-circle-outline", title: "Help & Support", subtitle: "FAQs, contact us", type: "navigate" },
  { id: "privacy", icon: "shield-outline", title: "Privacy Policy", type: "navigate" },
  { id: "terms", icon: "document-text-outline", title: "Terms of Service", type: "navigate" },
  { id: "about", icon: "information-circle-outline", title: "About HealthPlus", subtitle: "Version 1.0.0", type: "navigate" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(true);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to logout?")) {
        alert("You have been logged out successfully.");
      }
    } else {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", style: "destructive", onPress: () => Alert.alert("Success", "You have been logged out.") },
        ]
      );
    }
  };

  const handleMenuPress = (item: MenuItem) => {
    if (Platform.OS === "web") {
      alert(`Opening ${item.title}...`);
    } else {
      Alert.alert(item.title, `This feature will be available soon.`);
    }
  };

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-primary px-6 pt-16 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <View className="flex-row items-center">
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-bold text-white">Ahmed Al-Mansouri</Text>
              <Text className="text-base text-white/80">ahmed.mansouri@email.com</Text>
              <Text className="text-sm text-white/60">+974 5555 1234</Text>
            </View>
            <Pressable 
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              onPress={() => handleMenuPress({ id: "edit", icon: "", title: "Edit Profile", type: "navigate" })}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-6 gap-3">
            <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
              <Text className="text-2xl font-bold text-white">12</Text>
              <Text className="text-xs text-white/70">Appointments</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
              <Text className="text-2xl font-bold text-white">2,750</Text>
              <Text className="text-xs text-white/70">Points</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
              <Text className="text-2xl font-bold text-white">Silver</Text>
              <Text className="text-xs text-white/70">Tier</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-6 pt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Settings</Text>
          
          {/* Dark Mode Toggle */}
          <View className="bg-surface rounded-2xl shadow-sm overflow-hidden mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <View className="flex-row items-center p-4 border-b border-border">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="moon-outline" size={20} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base text-foreground">Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            
            <View className="flex-row items-center p-4">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base text-foreground">Biometric Login</Text>
                <Text className="text-xs text-muted">Use Face ID or fingerprint</Text>
              </View>
              <Switch
                value={biometricLogin}
                onValueChange={setBiometricLogin}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-6">
          <Text className="text-lg font-bold text-foreground mb-3">Account</Text>
          <View className="bg-surface rounded-2xl shadow-sm overflow-hidden" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            {menuItems.slice(0, 5).map((item, index) => (
              <Pressable
                key={item.id}
                className={`flex-row items-center p-4 ${index > 0 ? "border-t border-border" : ""}`}
                onPress={() => handleMenuPress(item)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base text-foreground">{item.title}</Text>
                  {item.subtitle && <Text className="text-xs text-muted">{item.subtitle}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Support Section */}
        <View className="px-6 pt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Support</Text>
          <View className="bg-surface rounded-2xl shadow-sm overflow-hidden" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            {menuItems.slice(5).map((item, index) => (
              <Pressable
                key={item.id}
                className={`flex-row items-center p-4 ${index > 0 ? "border-t border-border" : ""}`}
                onPress={() => handleMenuPress(item)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base text-foreground">{item.title}</Text>
                  {item.subtitle && <Text className="text-xs text-muted">{item.subtitle}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-6 pt-6 pb-8">
          <Pressable
            className="bg-error/10 py-4 rounded-xl flex-row items-center justify-center"
            onPress={handleLogout}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text className="text-error font-semibold ml-2">Logout</Text>
          </Pressable>
        </View>

        {/* App Version */}
        <View className="items-center pb-8">
          <Text className="text-xs text-muted">HealthPlus v1.0.0</Text>
          <Text className="text-xs text-muted">© 2026 HeliumDoc. All rights reserved.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
