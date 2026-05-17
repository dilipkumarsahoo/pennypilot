import Button from "@/components/Button";
import { getBudgetsFromDB } from "@/services/database";
import { Budget, useFinanceStore } from "@/store/financeStore";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { Plus } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function BudgetScreen() {
  const {
    budgets,
    transactionCategories,
    addBudget,
    updateBudget,
    deleteBudget,
    addTransactionCategory,
    setBudgets,
    loadTransactionCategories,
    loadTransactions,
    deleteTransactionCategory,
  } = useFinanceStore();
  const { colors } = useThemeStore();
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBudgets();
    loadTransactions();
    loadTransactionCategories();
    console.log("Budget", transactionCategories);
  }, []);

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      const budgetsFromDB = await getBudgetsFromDB();
      setBudgets(budgetsFromDB);
    } catch (error) {
      console.error("Error loading budgets:", error);
      Alert.alert("Error", "Failed to load budgets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBudget = async () => {
    if (!category || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await addBudget({
        category,
        amount: parseFloat(amount),
      });

      setCategory("");
      setAmount("");
      setShowForm(false);
    } catch (error) {
      Alert.alert("Error", "Failed to add budget. Please try again.");
      console.error("Error adding budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    try {
      setIsLoading(true);
      if (editingCategory) {
        // Delete old category and add new one
        await deleteTransactionCategory(editingCategory);
        await addTransactionCategory(newCategory);
        setEditingCategory(null);
      } else {
        await addTransactionCategory(newCategory);
      }
      setNewCategory("");
      setShowCategoryModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to add category. Please try again.");
      console.error("Error adding category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteBudget(id);
    } catch (error) {
      Alert.alert("Error", "Failed to delete budget. Please try again.");
      console.error("Error deleting budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    try {
      setIsLoading(true);
      await deleteTransactionCategory(category);
    } catch (error) {
      Alert.alert("Error", "Failed to delete category. Please try again.");
      console.error("Error deleting category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (selectedCategory: string) => {
    console.log("clicked budget");
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handleEditCategory = (category: string) => {
    setEditingCategory(category);
    setNewCategory(category);
    setShowCategoryModal(true);
  };

  const renderBudget = ({ item }: { item: Budget }) => {
    const progress = (item.spent / item.amount) * 100;
    const remaining = item.amount - item.spent;

    return (
      <View style={[styles.budgetCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
        <View style={styles.budgetHeader}>
          <Text style={[styles.budgetCategory, { color: colors.text }]}>{item.category}</Text>
          <Text style={[styles.budgetAmount, { color: colors.text }]}>${item.amount.toFixed(2)}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: progress > 100 ? colors.danger : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>{progress.toFixed(1)}% spent</Text>
        </View>

        <View style={styles.budgetDetails}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Spent</Text>
            <Text
              style={[
                styles.detailValue,
                { color: colors.danger, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              ${item.spent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Remaining</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: remaining >= 0 ? colors.success : colors.danger,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
            >
              ${remaining.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, isLoading && styles.disabledButton]}
          onPress={() => handleDeleteBudget(item.id)}
          disabled={isLoading}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Budget</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={[styles.form, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.categoryButton, { borderColor: colors.border }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.categoryButtonText, { color: colors.textSecondary }]}>
              {category || "Select Category"}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholderTextColor={colors.textSecondary}
            placeholder="Budget Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? "Adding..." : "Add Budget"}
              onPress={handleAddBudget}
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

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? "Edit Category" : "Add Category"}
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholderTextColor={colors.textSecondary}
                placeholder="Category name"
                value={newCategory}
                onChangeText={setNewCategory}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.categoryList}>
              <Text style={[styles.categoryHeader, { color: colors.text }]}>Existing Categories</Text>
              <FlatList
                data={transactionCategories}
                renderItem={({ item }) => (
                  <View style={[styles.categoryItem, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                      style={styles.categoryTextContainer}
                      onPress={() => handleSelectCategory(item)}
                    >
                      <Text style={[styles.categoryText, { color: colors.text }]}>{item}</Text>
                    </TouchableOpacity>
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        onPress={() => handleEditCategory(item)}
                        style={styles.categoryActionButton}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color="#2563eb"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(item)}
                        style={styles.categoryActionButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#dc2626"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleAddCategory}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {editingCategory ? "Update Category" : "Add Category"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderBudget}
        contentContainerStyle={styles.list}
      />
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
  addButtonText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#2563eb",
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
  categoryButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  categoryButtonText: {
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
  },
  list: {
    padding: 20,
  },
  budgetCard: {
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
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#111827",
  },
  budgetAmount: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
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
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
    marginTop: 4,
  },
  budgetDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
  },
  inputContainer: {
    marginBottom: 16,
  },
  categoryList: {
    marginBottom: 16,
  },
  categoryHeader: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  categoryText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#111827",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  categoryActionButton: {
    padding: 4,
  },
  button: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  disabledButton: {
    backgroundColor: "#e5e7eb",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryTextContainer: {
    flex: 1,
  },
});
