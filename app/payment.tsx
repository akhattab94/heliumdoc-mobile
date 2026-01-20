import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type PaymentMethod = "card" | "apple_pay" | "google_pay" | "qpay" | "naps";

export default function PaymentScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    appointmentId: string;
    amount: string;
    doctorName: string;
    date: string;
    time: string;
  }>();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const amount = parseInt(params.amount || "0");
  const appointmentId = parseInt(params.appointmentId || "0");

  // Get payment methods
  const { data: paymentMethods } = trpc.payments.getPaymentMethods.useQuery();

  // Create payment intent mutation
  const createPaymentIntent = trpc.payments.createPaymentIntent.useMutation();
  const confirmPayment = trpc.payments.confirmPayment.useMutation();

  // Format card number with spaces
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "").replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  // Format expiry date
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (selectedMethod === "card") {
      // Validate card details
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
        Alert.alert("Error", "Please enter a valid card number");
        return;
      }
      if (!expiryDate || expiryDate.length < 5) {
        Alert.alert("Error", "Please enter a valid expiry date");
        return;
      }
      if (!cvv || cvv.length < 3) {
        Alert.alert("Error", "Please enter a valid CVV");
        return;
      }
      if (!cardName) {
        Alert.alert("Error", "Please enter the cardholder name");
        return;
      }
    }

    setProcessing(true);

    try {
      // Create payment intent
      const intent = await createPaymentIntent.mutateAsync({
        appointmentId,
        amount: amount * 100, // Convert to smallest unit
        currency: "QAR",
      });

      setPaymentIntentId(intent.paymentIntentId);

      // Confirm payment
      const result = await confirmPayment.mutateAsync({
        paymentIntentId: intent.paymentIntentId,
        paymentMethodId: `pm_${selectedMethod}_${Date.now()}`,
      });

      if (result.status === "processing") {
        // Simulate payment completion
        setTimeout(() => {
          setProcessing(false);
          Alert.alert(
            "Payment Successful",
            "Your appointment has been confirmed!",
            [
              {
                text: "View Appointment",
                onPress: () => router.replace("/(tabs)"),
              },
            ]
          );
        }, 2000);
      }
    } catch (error: any) {
      setProcessing(false);
      Alert.alert("Payment Failed", error.message || "Please try again");
    }
  };

  const PaymentMethodCard = ({
    id,
    name,
    description,
    icon,
  }: {
    id: PaymentMethod;
    name: string;
    description: string;
    icon: string;
  }) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 rounded-xl border ${
        selectedMethod === id ? "border-primary bg-primary/10" : "border-border bg-surface"
      }`}
      onPress={() => setSelectedMethod(id)}
    >
      <View className={`w-12 h-12 rounded-full items-center justify-center ${
        selectedMethod === id ? "bg-primary" : "bg-muted/20"
      }`}>
        <IconSymbol
          name={icon === "credit-card" ? "creditcard.fill" : "creditcard.fill"}
          size={24}
          color={selectedMethod === id ? "#fff" : colors.muted}
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-semibold">{name}</Text>
        <Text className="text-muted text-sm">{description}</Text>
      </View>
      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
        selectedMethod === id ? "border-primary bg-primary" : "border-muted"
      }`}>
        {selectedMethod === id && (
          <IconSymbol name="checkmark" size={14} color="#fff" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground ml-4">Payment</Text>
        </View>

        <View className="p-4">
          {/* Order Summary */}
          <View className="bg-surface rounded-xl p-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Order Summary</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Doctor</Text>
              <Text className="text-foreground font-medium">{params.doctorName}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Date</Text>
              <Text className="text-foreground">{params.date}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Time</Text>
              <Text className="text-foreground">{params.time}</Text>
            </View>
            <View className="border-t border-border my-3" />
            <View className="flex-row justify-between">
              <Text className="text-foreground font-semibold">Total</Text>
              <Text className="text-primary font-bold text-xl">QAR {amount}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <Text className="text-lg font-semibold text-foreground mb-3">Payment Method</Text>
          <View className="gap-3 mb-6">
            <PaymentMethodCard
              id="card"
              name="Credit/Debit Card"
              description="Visa, Mastercard, Amex"
              icon="credit-card"
            />
            <PaymentMethodCard
              id="apple_pay"
              name="Apple Pay"
              description="Pay with Apple Pay"
              icon="apple"
            />
            <PaymentMethodCard
              id="qpay"
              name="QPay"
              description="Qatar National Payment"
              icon="qpay"
            />
          </View>

          {/* Card Details */}
          {selectedMethod === "card" && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-foreground mb-3">Card Details</Text>
              
              <View className="mb-4">
                <Text className="text-foreground font-medium mb-2">Card Number</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.muted}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-foreground font-medium mb-2">Expiry Date</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="MM/YY"
                    placeholderTextColor={colors.muted}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium mb-2">CVV</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                    placeholder="123"
                    placeholderTextColor={colors.muted}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-foreground font-medium mb-2">Cardholder Name</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="John Doe"
                  placeholderTextColor={colors.muted}
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Security Note */}
          <View className="flex-row items-center bg-success/10 rounded-xl p-4 mb-6">
            <IconSymbol name="lock.fill" size={20} color={colors.success} />
            <Text className="text-success ml-2 flex-1">
              Your payment is secured with 256-bit SSL encryption
            </Text>
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            className={`py-4 rounded-xl items-center ${processing ? "bg-muted" : "bg-primary"}`}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#fff" />
                <Text className="text-white font-semibold text-lg ml-2">Processing...</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-lg">Pay QAR {amount}</Text>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity className="mt-4" onPress={() => router.back()}>
            <Text className="text-muted text-center">Cancel Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
