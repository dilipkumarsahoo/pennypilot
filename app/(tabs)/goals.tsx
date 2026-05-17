import React, { useState, useEffect } from "react";
import { View,Text,StyleSheet,FlatList,TouchableOpacity,TextInput,Alert,Platform,Modal} from "react-native";
import { useFinanceStore, Goal } from "@/store/financeStore";
import { Plus, Calendar } from "lucide-react-native";
import { format } from "date-fns";
import { getGoalsFromDB } from "@/services/database";
import DateTimePicker from "@react-native-community/datetimepicker";
import Button from "@/components/Button";

export default function GoalsScreen() {
  const { goals, addGoal, updateGoalProgress, deleteGoal, setGoals } =
    useFinanceStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [modalAmount, setModalAmount] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const goalsFromDB = await getGoalsFromDB();
      setGoals(goalsFromDB);
    } catch (error) {
      console.error("Error loading goals:", error);
      Alert.alert("Error", "Failed to load goals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!name || !targetAmount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await addGoal({
        name,
        targetAmount: parseFloat(targetAmount),
        deadline,
      });

      setName("");
      setTargetAmount("");
      setDeadline(new Date());
      setShowForm(false);
    } catch (error) {
      Alert.alert("Error", "Failed to add goal. Please try again.");
      console.error("Error adding goal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId: string, amount: number) => {
    try {
      setIsLoading(true);
      await updateGoalProgress(goalId, amount);
    } catch (error) {
      Alert.alert("Error", "Failed to update goal progress. Please try again.");
      console.error("Error updating goal progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      setIsLoading(true);
      await deleteGoal(goalId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete goal. Please try again.");
      console.error("Error deleting goal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGoal = ({ item }: { item: Goal }) => {
    const progress = (item.currentAmount / item.targetAmount) * 100;
    const remaining = item.targetAmount - item.currentAmount;
    const openContributionModal = () => {
      setSelectedGoalId(item.id);
      setModalAmount('');
      setModalVisible(true);
    };

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalName}>{item.name}</Text>
          <Text style={styles.goalDeadline}>
            Due {format(new Date(item.deadline), "MMM dd, yyyy")}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(progress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            ${item.currentAmount.toFixed(2)} of ${item.targetAmount.toFixed(2)}{" "}
            ({progress.toFixed(1)}%)
          </Text>
        </View>

        <Text style={styles.remainingText}>${remaining.toFixed(2)} to go</Text>

        <View style={styles.buttonContainer}>
          {remaining > 0 ? (
            <>
              <TouchableOpacity
                style={[styles.contributeButton, isLoading && styles.disabledButton, { flex: 1 }]}
                onPress={openContributionModal}
                disabled={isLoading}
              >
                <Text style={styles.contributeButtonText}>Add</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, isLoading && styles.disabledButton, { flex: 1 }]}
                onPress={() => handleDeleteGoal(item.id)}
                disabled={isLoading}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>🎉 Completed</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Goal Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Target Amount"
            value={targetAmount}
            onChangeText={(text) => {
              // Only allow numbers and decimal point
              const numericValue = text.replace(/[^0-9.]/g, "");
              // Ensure only one decimal point
              const parts = numericValue.split(".");
              if (parts.length > 2) return;
              // Limit decimal places to 2
              if (parts[1] && parts[1].length > 2) return;
              setTargetAmount(numericValue);
            }}
            keyboardType="numeric"
            maxLength={10}
          />
          
          {Platform.OS === "web" ? (
            <View style={styles.dateInputContainer}>
              <Calendar size={20} color="#6b7280" style={styles.dateIcon} />
              <input
                type="date"
                value={format(deadline, "yyyy-MM-dd")}
                onChange={(e) => setDeadline(new Date(e.target.value))}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  width: "100%",
                  fontFamily: "Inter_400Regular",
                  fontSize: 16,
                }}
                aria-label="Select deadline"
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {format(deadline, "MMMM d, yyyy")}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) setDeadline(selectedDate);
                  }}
                />
              )}
            </>
            // <TouchableOpacity
            //   style={styles.dateButton}
            //   onPress={() => {
            //     // Native date picker would go here
            //     // Since we're focusing on web, this is just a placeholder
            //   }}
            // >
            //   <Calendar size={20} color="#6b7280" />
            //   <Text style={styles.dateButtonText}>
            //     {format(deadline, 'MMMM d, yyyy')}
            //   </Text>
            // </TouchableOpacity>
          )}
          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? "Adding..." : "Add Goal"}
              onPress={handleAddGoal}
              color="#6366f1"
            />
            <Button
              title={isLoading ? "Adding..." : "Cancel"}
              onPress={() => setShowForm(false)}
              color="red"
            />
          </View>
        </View>
      )}

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

<Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Contribution Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={modalAmount}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9.]/g, '');
                const parts = sanitized.split('.');
                if (parts.length > 2 || (parts[1]?.length > 2)) return;
                setModalAmount(sanitized);
              }}
              editable={!isLoading}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                onPress={() => {
                  const numericAmount = parseFloat(modalAmount);
                  const goal = goals.find((g) => g.id === selectedGoalId);
                
                  if (!goal) {
                    Alert.alert('Error', 'Goal not found');
                    return;
                  }
                
                  const remaining = goal.targetAmount - goal.currentAmount;
                
                  if (isNaN(numericAmount) || numericAmount <= 0) {
                    Alert.alert('Invalid Amount', 'Please enter a valid number.');
                    return;
                  }
                
                  if (numericAmount > remaining) {
                    Alert.alert('Too Much', `You can only contribute up to $${remaining.toFixed(2)}`);
                    return;
                  }
                
                  handleUpdateProgress(goal.id, numericAmount);
                  setModalVisible(false);
                  setModalAmount('');
                  setSelectedGoalId(null);
                }}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton]}
                onPress={() => {
                  setModalVisible(false);
                  setModalAmount('');
                  setSelectedGoalId(null);
                }}
              >
                <Text style={styles.deleteButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    backgroundColor: "#ffffff",
    padding: 20,
    margin: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: "Inter_400Regular",
  },
  list: {
    padding: 20,
  },
  goalCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalHeader: {
    marginBottom: 12,
  },
  goalName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
  },
  goalDeadline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
    marginTop: 8,
  },
  remainingText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#059669",
    marginBottom: 12,
  },
  contributeButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  contributeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  disabledButton: {
    opacity: 0.5,
  },
  dateInputContainer: {
    position: "relative",
    marginBottom: 12,
  },
  dateIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dateButtonText: {
    marginLeft: 8,
    fontFamily: "Inter_400Regular",
    color: "#111827",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  completedBadge: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#10b981', // green
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  }
});
