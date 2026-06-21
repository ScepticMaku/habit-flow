import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useHabits } from '../../context/HabitContext';
import { supabase } from '../../utils/supabase'; // Make sure this path matches your project
import { AIMessage } from '../../constants/data';

export default function AICoachScreen() {
  const { habits } = useHabits();
  // CHANGED: Start with an empty array instead of mockAIMessages
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const userText = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userText,
          habits: habits.map(h => ({
            name: h.name,
            category: h.category,
            current: h.current,
            target: h.target,
            unit: h.unit,
            time: h.time,
            completedToday: h.completedToday,
          }))
        },
      });

      if (error) throw error;

      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.reply || "I'm having trouble connecting right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: "⚠️ Sorry, I encountered an error. Please make sure the AI service is configured correctly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { icon: 'flame', label: 'Streak Tips', color: Colors.accent, prompt: "Give me a tip to keep my habit streak going!" },
    { icon: 'trophy', label: 'Set a Goal', color: '#F59E0B', prompt: "Help me set a realistic goal for this week based on my current habits." },
    { icon: 'fitness', label: 'Workout Plan', color: '#7C3AED', prompt: "Suggest a quick workout I can add to my routine." },
    { icon: 'moon', label: 'Sleep Better', color: Colors.info, prompt: "How can I improve my sleep based on my evening habits?" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={20} color={Colors.textInverse} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Coach</Text>
              <Text style={styles.headerStatus}>
                {isTyping ? 'Typing...' : 'Online · Ready to help'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick action chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActions}
        >
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickBtn}
              activeOpacity={0.7}
              onPress={() => {
                setInput(action.prompt);
              }}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + '18' }]}>
                <Ionicons name={action.icon as any} size={16} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* NEW: Empty State when there are no messages */}
          {messages.length === 0 && !isTyping && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles" size={40} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySub}>
                Ask me about your habits, streaks, or daily goals!
              </Text>
            </View>
          )}

          {messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.msgRow, msg.role === 'user' && styles.msgRowRight]}
            >
              {msg.role === 'ai' && (
                <View style={styles.msgAvatar}>
                  <Ionicons name="sparkles" size={14} color={Colors.textInverse} />
                </View>
              )}
              <View
                style={[
                  styles.msgBubble,
                  msg.role === 'ai' ? styles.msgBubbleAI : styles.msgBubbleUser,
                ]}
              >
                <Text
                  style={[
                    styles.msgText,
                    msg.role === 'user' && styles.msgTextUser,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.msgTime,
                    msg.role === 'user' && styles.msgTimeUser,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.msgRow}>
              <View style={styles.msgAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.textInverse} />
              </View>
              <View style={[styles.msgBubble, styles.msgBubbleAI, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { opacity: 0.3 }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Ask your AI Coach..."
              placeholderTextColor={Colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={!isTyping}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                input.trim() && !isTyping ? styles.sendBtnActive : styles.sendBtnInactive
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <Ionicons name="arrow-up" size={20} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  quickActions: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  quickBtn: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    paddingVertical: 6,          // Slimmed down
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
    height: 60
  },
  quickIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,             // Tightened gap
  },
  quickLabel: {
    fontSize: 10,                 // Slightly smaller text
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chatArea: {
    paddingHorizontal: Spacing.xxl,
  },
  chatContent: {
    paddingBottom: Spacing.lg,
  },
  // NEW: Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginBottom: 16,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  msgBubbleAI: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: Radius.xs,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  msgBubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  msgText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  msgTextUser: {
    color: Colors.textInverse,
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  msgTimeUser: {
    color: 'rgba(255,255,255,0.6)',
  },
  typingBubble: {
    paddingVertical: Spacing.md + 4,
    paddingLeft: Spacing.lg + 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  inputBar: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.bg,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
  },
  sendBtnInactive: {
    backgroundColor: Colors.border,
  },
});
