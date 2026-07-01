import { Transaction, useFinanceStore } from "@/store/financeStore";
import {
  getDeleteCategoryErrorMessage,
  getSaveCategoryErrorMessage,
  isExpectedCategoryError,
} from "@/utils/financeErrors";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  CreditCard as Edit,
  EllipsisVertical as MoreVertical,
  Plus,
  Trash,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// import { Picker } from '@react-native-picker/picker';
import { useThemeStore } from "@/store/themeStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

export default function TransactionsScreen() {
  const {
    transactions,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    loadCategories,
    loadTransactions,
    loadAllDataAsJson,
    initialize,
  } = useFinanceStore();
  const { colors } = useThemeStore();
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense",
  );
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initialize();
    loadCategories();
    loadTransactions();
  }, []);

  const handleAddTransaction = async () => {
    if (!amount || !description || !category) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const transaction = {
        amount: Math.abs(parseFloat(amount)),
        description,
        category,
        date: selectedDate,
        type: transactionType,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transaction);
        setEditingTransaction(null);
      } else {
        await addTransaction(transaction);
      }

      setAmount("");
      setDescription("");
      setCategory("");
      setSelectedDate(new Date());
      setTransactionType("expense");
      setShowForm(false);

      await loadTransactions();
    } catch (error) {
      Alert.alert("Error", "Failed to add transaction. Please try again.");
      console.error("Error adding transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAmount(Math.abs(transaction.amount).toString());
    setDescription(transaction.description);
    setCategory(transaction.category);
    setTransactionType(transaction.type);
    setSelectedDate(new Date(transaction.date));
    setShowForm(true);
    setShowMenu(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteTransaction(id);
      setShowMenu(null);
    } catch (error) {
      Alert.alert("Error", "Failed to delete transaction. Please try again.");
      console.error("Error deleting transaction:", error);
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
        await updateCategory(editingCategory, newCategory);
        if (category === editingCategory) {
          setCategory(newCategory);
        }
        setEditingCategory(null);
      } else {
        await addCategory(newCategory);
        setCategory(newCategory);
      }
      setNewCategory("");
      setShowCategoryModal(false);
    } catch (error) {
      Alert.alert("Error", getSaveCategoryErrorMessage(error));
      if (!isExpectedCategoryError(error)) {
        console.error("Error adding category:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    try {
      setIsLoading(true);
      await deleteCategory(categoryToDelete);
      // Clear the selected category if it was deleted
      if (category === categoryToDelete) {
        setCategory("");
      }
    } catch (error) {
      Alert.alert("Error", getDeleteCategoryErrorMessage(error));
      if (!isExpectedCategoryError(error)) {
        console.error("Error deleting category:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (categoryToEdit: string) => {
    setIsManagingCategories(true);
    setEditingCategory(categoryToEdit);
    setNewCategory(categoryToEdit);
    setShowCategoryModal(true);
  };

  const handleSelectCategory = (selectedCategory: string) => {
    setCategory(selectedCategory);
    closeCategoryModal();
  };

  const openCategoryModal = () => {
    setIsManagingCategories(false);
    setEditingCategory(null);
    setNewCategory("");
    setShowCategoryModal(true);
  };

  const openCategoryManager = () => {
    setIsManagingCategories(true);
    setEditingCategory(null);
    setNewCategory("");
  };

  const closeCategoryManager = () => {
    setIsManagingCategories(false);
    setEditingCategory(null);
    setNewCategory("");
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setIsManagingCategories(false);
    setEditingCategory(null);
    setNewCategory("");
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const groupedTransactions = transactions.reduce(
    (groups, transaction) => {
      // Extract just the date portion (yyyy-MM-dd)
      const date = format(
        typeof transaction.date === "string"
          ? parseISO(transaction.date)
          : transaction.date,
        "yyyy-MM-dd",
      );
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, Transaction[]>,
  );

  // console.log("groupedTransactions", groupedTransactions)

  // Sort the dates in descending order
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View
      style={[
        styles.transactionCard,
        { backgroundColor: colors.card, shadowColor: colors.border },
      ]}
    >
      <View style={styles.transactionHeader}>
        <View>
          <Text style={[styles.transactionCategory, { color: colors.text }]}>
            {item.category}
          </Text>
          <Text
            style={[
              styles.transactionDescription,
              { color: colors.textSecondary },
            ]}
          >
            {item.description}
          </Text>
          <Text
            style={[styles.transactionDate, { color: colors.textSecondary }]}
          >
            {format(new Date(item.date), "MMM dd, yyyy")}
          </Text>
        </View>
        <View style={styles.rightSection}>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.type === "income" ? "#059669" : "#dc2626" },
            ]}
          >
            ${item.amount.toFixed(2)}
          </Text>
          <TouchableOpacity
            onPress={() => setShowMenu(showMenu === item.id ? null : item.id)}
            style={styles.menuButton}
          >
            <MoreVertical size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {showMenu === item.id && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleEdit(item)}
          >
            <Edit size={16} color="#6b7280" />
            <Text style={styles.menuText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleDelete(item.id)}
          >
            <Trash size={16} color="#dc2626" />
            <Text style={[styles.menuText, { color: "#dc2626" }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setShowForm(true);
            setEditingTransaction(null);
            setAmount("");
            setDescription("");
            setCategory("");
            setSelectedDate(new Date());
            setTransactionType("expense");
          }}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View
          style={[
            styles.formContainer,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <View style={[styles.form, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.typeToggle,
                { backgroundColor: colors.background },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === "expense" && [
                    styles.activeTypeButton,
                    { backgroundColor: colors.card },
                  ],
                ]}
                onPress={() => setTransactionType("expense")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === "expense" &&
                      styles.activeTypeButtonText,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === "income" && styles.activeTypeButton,
                ]}
                onPress={() => setTransactionType("income")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === "income" && styles.activeTypeButtonText,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholderTextColor={colors.textSecondary}
              placeholder="Amount"
              value={amount}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9.]/g, "");
                const parts = numericValue.split(".");
                if (parts.length > 2) return;
                if (parts[1] && parts[1].length > 2) return;
                setAmount(numericValue);
              }}
              keyboardType="numeric"
              maxLength={10}
            />
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.text },
              ]}
              placeholderTextColor={colors.textSecondary}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <TouchableOpacity
              style={[styles.categoryButton, { borderColor: colors.border }]}
              onPress={openCategoryModal}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                {category || "Select Category"}
              </Text>
            </TouchableOpacity>

            {Platform.OS === "web" ? (
              <View style={styles.dateInputContainer}>
                <Calendar size={20} color="#6b7280" style={styles.dateIcon} />
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.text,
                    padding: 12,
                    marginBottom: 12,
                    width: "100%",
                    fontFamily: "Inter_400Regular",
                    fontSize: 16,
                  }}
                  aria-label="Select date"
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#6b7280" />
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {format(selectedDate, "MMMM d, yyyy")}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleAddTransaction}
              >
                <Text style={styles.submitButtonText}>
                  {editingTransaction ? "Update" : "Add"} Transaction
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowForm(false);
                  setEditingTransaction(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={sortedDates}
        keyExtractor={(date) => date}
        renderItem={({ item: date }) => (
          <View style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { color: colors.textSecondary }]}>
              {format(new Date(date), "MMMM d, yyyy")}
            </Text>
            <Text style={styles.dateHeader}></Text>
            {groupedTransactions[date].map((transaction) => (
              <React.Fragment key={transaction.id}>
                {renderTransaction({ item: transaction })}
              </React.Fragment>
            ))}
            {/* <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={loadAllDataAsJson}
            >
              <Text style={styles.submitButtonText}>
                {" get All Transaction"}
              </Text>
            </TouchableOpacity> */}
          </View>
        )}
        contentContainerStyle={styles.list}
      />

      {showDatePicker &&
        (Platform.OS === "web" ? (
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => {
              const date = new Date(e.target.value);
              setSelectedDate(date);
              setShowDatePicker(false);
            }}
            style={{
              position: "absolute",
              top: 100,
              right: 20,
              zIndex: 1000,
              color: colors.text,
              padding: 8,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
            }}
            aria-label="Select date"
            title="Select date"
          />
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            onChange={(_, date) => {
              if (date) setSelectedDate(date);
              setShowDatePicker(false);
            }}
          />
        ))}

      {showCategoryModal && (
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={closeCategoryModal}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isManagingCategories
                    ? editingCategory
                      ? "Edit Category"
                      : "Manage Categories"
                    : "Select Category"}
                </Text>
                <View style={styles.modalHeaderActions}>
                  {!isManagingCategories && (
                    <TouchableOpacity
                      onPress={openCategoryManager}
                      style={styles.headerActionButton}
                    >
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={closeCategoryModal}
                    style={styles.headerActionButton}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <FlatList
                ListHeaderComponent={
                  <View style={styles.categoryList}>
                    <Text
                      style={[styles.categoryHeader, { color: colors.text }]}
                    >
                      Existing Categories
                    </Text>
                  </View>
                }
                data={categories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <View style={styles.categoryItem}>
                    <TouchableOpacity
                      style={styles.categoryTextContainer}
                      onPress={() => handleSelectCategory(item)}
                    >
                      <Text
                        style={[styles.categoryText, { color: colors.text }]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                    {isManagingCategories && (
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
                    )}
                  </View>
                )}
                ListFooterComponent={
                  isManagingCategories ? (
                    <View style={styles.addCategorySection}>
                      <Text
                        style={[styles.categoryHeader, { color: colors.text }]}
                      >
                        Add New Category
                      </Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={[
                            styles.input,
                            { borderColor: colors.border, color: colors.text },
                          ]}
                          placeholderTextColor={colors.textSecondary}
                          placeholder="Category name"
                          value={newCategory}
                          onChangeText={setNewCategory}
                          autoCapitalize="words"
                        />
                      </View>
                      <View style={styles.categoryButtons}>
                        <TouchableOpacity
                          style={styles.categorySubmitButton}
                          onPress={handleAddCategory}
                          disabled={isLoading}
                        >
                          <Text style={styles.categorySubmitButtonText}>
                            {editingCategory
                              ? "Update Category"
                              : "Add Category"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.categoryCancelButton}
                          onPress={closeCategoryManager}
                        >
                          <Text style={styles.categoryCancelButtonText}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null
                }
              />
            </View>
          </View>
        </Modal>
      )}
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
  formContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  form: {
    backgroundColor: "#ffffff",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  typeToggle: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTypeButton: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#6b7280",
  },
  activeTypeButtonText: {
    color: "#6366f1",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: "Inter_400Regular",
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
  submitButton: {
    flex: 1,
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  list: {
    padding: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#6b7280",
    marginBottom: 8,
  },
  transactionCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionCategory: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#111827",
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginRight: 8,
  },
  menuButton: {
    padding: 4,
  },
  menu: {
    position: "absolute",
    right: 16,
    top: 40,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  menuText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#6b7280",
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  categoryList: {
    marginBottom: 16,
  },
  categoryHeader: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  categoryTextContainer: {
    flex: 1,
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
  addCategorySection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  categoryButtons: {
    flexDirection: "row",
    gap: 12,
  },
  categorySubmitButton: {
    flex: 1,
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categorySubmitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  categoryCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryCancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#111827",
  },
  datePickerBody: {
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
