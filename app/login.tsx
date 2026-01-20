import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";

type AuthMode = "phone" | "email" | "register";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [mode, setMode] = useState<AuthMode>("phone");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+974");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone OTP mutations
  const requestOTP = trpc.auth.requestPhoneOTP.useMutation();
  const verifyOTP = trpc.auth.verifyPhoneOTP.useMutation();
  
  // Email mutations
  const loginEmail = trpc.auth.loginWithEmail.useMutation();
  const registerEmail = trpc.auth.registerWithEmail.useMutation();

  const handleRequestOTP = async () => {
    if (!phone || phone.length < 8) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const result = await requestOTP.mutateAsync({
        phone: phone.replace(/\s/g, ""),
        countryCode,
      });

      if (result.success) {
        setOtpSent(true);
        // For demo, show OTP in alert
        if (result.demoOTP) {
          Alert.alert("Demo OTP", `Your OTP is: ${result.demoOTP}`);
        } else {
          Alert.alert("Success", "OTP sent to your phone");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP.mutateAsync({
        phone: phone.replace(/\s/g, ""),
        countryCode,
        otp,
        name: name || undefined,
      });

      if (result.success && result.sessionToken) {
        await Auth.setSessionToken(result.sessionToken);
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod || "phone",
            lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
          });
        }
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await loginEmail.mutateAsync({ email, password });

      if (result.success && result.sessionToken) {
        await Auth.setSessionToken(result.sessionToken);
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod || "email",
            lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
          });
        }
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await registerEmail.mutateAsync({
        name,
        email,
        password,
        phone: phone ? `${countryCode}${phone.replace(/\s/g, "")}` : undefined,
      });

      if (result.success && result.sessionToken) {
        await Auth.setSessionToken(result.sessionToken);
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name,
            email: result.user.email,
            loginMethod: result.user.loginMethod || "email",
            lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
          });
        }
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 p-6">
            {/* Header */}
            <View className="items-center mt-8 mb-8">
              <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
                <IconSymbol name="heart.fill" size={40} color="#fff" />
              </View>
              <Text className="text-3xl font-bold text-foreground">HealthPlus</Text>
              <Text className="text-muted mt-2">Your health, simplified</Text>
            </View>

            {/* Mode Tabs */}
            <View className="flex-row bg-surface rounded-xl p-1 mb-6">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${mode === "phone" ? "bg-primary" : ""}`}
                onPress={() => { setMode("phone"); setOtpSent(false); }}
              >
                <Text className={`text-center font-medium ${mode === "phone" ? "text-white" : "text-muted"}`}>
                  Phone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${mode === "email" ? "bg-primary" : ""}`}
                onPress={() => setMode("email")}
              >
                <Text className={`text-center font-medium ${mode === "email" ? "text-white" : "text-muted"}`}>
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${mode === "register" ? "bg-primary" : ""}`}
                onPress={() => setMode("register")}
              >
                <Text className={`text-center font-medium ${mode === "register" ? "text-white" : "text-muted"}`}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phone Login */}
            {mode === "phone" && (
              <View className="gap-4">
                {!otpSent ? (
                  <>
                    <View>
                      <Text className="text-foreground font-medium mb-2">Phone Number</Text>
                      <View className="flex-row gap-2">
                        <View className="bg-surface border border-border rounded-xl px-4 py-3 w-20">
                          <Text className="text-foreground text-center">{countryCode}</Text>
                        </View>
                        <TextInput
                          className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                          placeholder="5555 5555"
                          placeholderTextColor={colors.muted}
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                          returnKeyType="done"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      className="bg-primary py-4 rounded-xl items-center"
                      onPress={handleRequestOTP}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white font-semibold text-lg">Send OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View>
                      <Text className="text-foreground font-medium mb-2">Enter OTP</Text>
                      <TextInput
                        className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-center text-2xl tracking-widest"
                        placeholder="000000"
                        placeholderTextColor={colors.muted}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                        returnKeyType="done"
                      />
                      <Text className="text-muted text-sm mt-2 text-center">
                        OTP sent to {countryCode} {phone}
                      </Text>
                    </View>

                    <View>
                      <Text className="text-foreground font-medium mb-2">Your Name (optional)</Text>
                      <TextInput
                        className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                        placeholder="Enter your name"
                        placeholderTextColor={colors.muted}
                        value={name}
                        onChangeText={setName}
                        returnKeyType="done"
                      />
                    </View>

                    <TouchableOpacity
                      className="bg-primary py-4 rounded-xl items-center"
                      onPress={handleVerifyOTP}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white font-semibold text-lg">Verify & Login</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setOtpSent(false)}>
                      <Text className="text-primary text-center">Change phone number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Email Login */}
            {mode === "email" && (
              <View className="gap-4">
                <View>
                  <Text className="text-foreground font-medium mb-2">Email</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="your@email.com"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View>
                  <Text className="text-foreground font-medium mb-2">Password</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="done"
                  />
                </View>

                <TouchableOpacity
                  className="bg-primary py-4 rounded-xl items-center"
                  onPress={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-lg">Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Register */}
            {mode === "register" && (
              <View className="gap-4">
                <View>
                  <Text className="text-foreground font-medium mb-2">Full Name</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="John Doe"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                  />
                </View>

                <View>
                  <Text className="text-foreground font-medium mb-2">Email</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="your@email.com"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View>
                  <Text className="text-foreground font-medium mb-2">Password</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="next"
                  />
                </View>

                <View>
                  <Text className="text-foreground font-medium mb-2">Phone (optional)</Text>
                  <View className="flex-row gap-2">
                    <View className="bg-surface border border-border rounded-xl px-4 py-3 w-20">
                      <Text className="text-foreground text-center">{countryCode}</Text>
                    </View>
                    <TextInput
                      className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="5555 5555"
                      placeholderTextColor={colors.muted}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-primary py-4 rounded-xl items-center"
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-lg">Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Skip for now */}
            <TouchableOpacity
              className="mt-6"
              onPress={() => router.replace("/(tabs)")}
            >
              <Text className="text-muted text-center">Skip for now</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-muted text-xs text-center mt-8">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
