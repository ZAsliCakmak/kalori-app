import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export type Field = {
  key: string;
  label: string;
  unit?: string;
  numeric?: boolean;
  placeholder?: string;
  required?: boolean;
};

/** Küçük formlar için alttan açılan pencere (kilo, egzersiz, hızlı kalori vb.). */
export function FormModal({
  visible,
  title,
  fields,
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  fields: Field[];
  initial?: Record<string, string>;
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) setValues(initial ?? {});
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = fields.every((f) => !f.required || (values[f.key] ?? "").trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
        <View className="rounded-t-3xl bg-white px-5 pb-10 pt-5">
          <Text className="mb-4 text-lg font-extrabold text-ink">{title}</Text>
          {fields.map((f) => (
            <View key={f.key} className="mb-3">
              <Text className="mb-1 text-xs font-semibold text-slate-500">{f.label}</Text>
              <View className="flex-row items-center rounded-2xl bg-pill px-4">
                <TextInput
                  value={values[f.key] ?? ""}
                  onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                  keyboardType={f.numeric ? "decimal-pad" : "default"}
                  placeholder={f.placeholder}
                  placeholderTextColor="#94a3b8"
                  className="h-12 flex-1 text-base font-semibold text-ink"
                />
                {f.unit ? <Text className="text-sm text-slate-500">{f.unit}</Text> : null}
              </View>
            </View>
          ))}
          <View className="mt-2 flex-row">
            <Pressable
              onPress={onClose}
              className="mr-2 h-12 flex-1 items-center justify-center rounded-full bg-pill"
            >
              <Text className="font-bold text-ink">Vazgeç</Text>
            </Pressable>
            <Pressable
              disabled={!valid}
              onPress={() => {
                onSubmit(values);
                onClose();
              }}
              className={`h-12 flex-1 items-center justify-center rounded-full ${
                valid ? "bg-brand" : "bg-slate-300"
              }`}
            >
              <Text className="font-bold text-white">{submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
