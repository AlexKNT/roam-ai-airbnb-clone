import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnswerCard, ChatBubble } from '@/components/chat/chat-bubble';
import { SourceLine } from '@/components/chat/source-line';
import { StarterChip } from '@/components/chat/starter-chip';
import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { findPolicyTopic, MAX_QUESTION_LENGTH } from '@/chat/topics';
import type { ChatTurn } from '@/chat/types';
import { usePolicyChat } from '@/chat/use-policy-chat';
import {
  policyChatCopy,
  policyChatSourceLabel,
  stayCopy,
  supportEmail,
} from '@/constants/copy';
import { useStay } from '@/sanity/use-stay';
import { color, iconSize, layout, spacing } from '@/theme';

export default function PolicyChatScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const stay = useStay(slug);
  const chat = usePolicyChat(slug ?? '', stay.data);
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }, []);

  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [chat.turns]);

  const header = (
    <View style={styles.header}>
      <IconButton icon="arrow-back" label={policyChatCopy.back} onPress={goBack} />
      <View style={styles.headerText}>
        <AppText variant="caption" color="textSecondary">
          {policyChatCopy.headerLabel}
        </AppText>
        <AppText variant="subheading" numberOfLines={1}>
          {stay.data?.name ?? policyChatCopy.loading}
        </AppText>
      </View>
    </View>
  );

  if (stay.status !== 'ready' || !stay.data) {
    return (
      <Screen background="surface" contentContainerStyle={styles.stateScreen}>
        {header}

        <View style={styles.stateBody}>
          {stay.status === 'loading' ? (
            <>
              <ActivityIndicator color={color.primary} />
              <AppText variant="caption" color="textSecondary">
                {policyChatCopy.loading}
              </AppText>
            </>
          ) : null}

          {stay.status === 'error' ? (
            <>
              <Alert tone="error" message={stay.error ?? stayCopy.loadError} />
              <Button label={stayCopy.retry} onPress={stay.retry} variant="secondary" />
            </>
          ) : null}

          {stay.status === 'notFound' ? (
            <>
              <AppText variant="heading">{stayCopy.notFoundTitle}</AppText>
              <AppText variant="body" color="textSecondary">
                {stayCopy.notFoundDescription}
              </AppText>
            </>
          ) : null}
        </View>
      </Screen>
    );
  }

  const nearLengthLimit = chat.draft.length >= MAX_QUESTION_LENGTH - 60;

  return (
    <Screen
      background="surface"
      scroll={false}
      bottomInset="none"
      contentContainerStyle={styles.chatScreen}>
      {header}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <ScrollView
          ref={scroll}
          style={styles.fill}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          <View style={styles.starters}>
            <AppText variant="label" color="textSecondary">
              {policyChatCopy.startersTitle}
            </AppText>
            <View style={styles.starterRow}>
              {chat.starters.map((starter) => (
                <StarterChip
                  key={starter.topicId}
                  label={starter.question}
                  onPress={() => chat.ask(starter.question)}
                />
              ))}
            </View>
          </View>

          {chat.turns.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="chatbubble-ellipses-outline" size={iconSize.lg} color={color.textMuted} />
              <AppText variant="subheading">{policyChatCopy.emptyTitle}</AppText>
              <AppText variant="body" color="textSecondary" align="center">
                {policyChatCopy.emptyDescription}
              </AppText>
            </View>
          ) : (
            chat.turns.map((turn) => <Turn key={turn.id} turn={turn} onRetry={chat.retry} />)
          )}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: insets.bottom + spacing[3] }]}>
          {chat.capped ? (
            <AppText variant="caption" color="textSecondary">
              {policyChatCopy.capReached(supportEmail)}
            </AppText>
          ) : (
            <>
              <View style={styles.composerRow}>
                <Input
                  value={chat.draft}
                  onChangeText={chat.setDraft}
                  label={policyChatCopy.fieldLabel}
                  placeholder={policyChatCopy.placeholder}
                  onSubmitEditing={() => chat.ask()}
                  style={styles.fill}
                />
                <IconButton
                  icon="send"
                  label={policyChatCopy.send}
                  size={layout.controlHeight}
                  disabled={chat.draft.trim().length === 0 || chat.sending}
                  onPress={() => chat.ask()}
                />
              </View>

              {nearLengthLimit ? (
                <AppText variant="caption" color="textMuted">
                  {policyChatCopy.lengthStop(chat.draft.length, MAX_QUESTION_LENGTH)}
                </AppText>
              ) : null}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

type TurnProps = {
  turn: ChatTurn;
  onRetry: (turnId: string) => void;
};

function Turn({ turn, onRetry }: TurnProps) {
  const suggestion = turn.closestTopicId
    ? (findPolicyTopic(turn.closestTopicId)?.label ?? null)
    : null;

  return (
    <View style={styles.turn}>
      <ChatBubble label={policyChatCopy.turnLabel(turn.question)}>
        <AppText variant="body">{turn.question}</AppText>

        {turn.status === 'pending' ? (
          <View style={styles.pending}>
            <ActivityIndicator size="small" color={color.textSecondary} />
            <AppText variant="caption" color="textMuted">
              {policyChatCopy.thinking}
            </AppText>
          </View>
        ) : null}
      </ChatBubble>

      {turn.status === 'answered' && turn.answers.length === 0 ? (
        <AnswerCard label={`${policyChatCopy.noAnswerTitle}. ${policyChatCopy.noAnswerBody}`}>
          <AppText variant="subheading">{policyChatCopy.noAnswerTitle}</AppText>
          <AppText variant="body" color="textSecondary">
            {policyChatCopy.noAnswerBody}
          </AppText>
          {suggestion ? (
            <AppText variant="caption" color="textSecondary">
              {policyChatCopy.suggestion(suggestion)}
            </AppText>
          ) : null}
          <AppText variant="caption" color="textMuted">
            {policyChatCopy.support(supportEmail)}
          </AppText>
        </AnswerCard>
      ) : null}

      {turn.status === 'answered'
        ? turn.answers.map((answer) => (
            <AnswerCard
              key={`${turn.id}-${answer.topicId}`}
              label={policyChatCopy.answerLabel(
                answer.title,
                answer.unavailable ? policyChatCopy.unavailableNote : answer.body,
                answer.source,
              )}>
              <AppText variant="subheading">{answer.title}</AppText>

              {answer.unavailable ? (
                <AppText variant="body" color="textSecondary">
                  {policyChatCopy.unavailableNote}
                </AppText>
              ) : (
                answer.body
                  .split('\n')
                  .map((line, index) => (
                    <AppText
                      key={`${answer.topicId}-line-${index}`}
                      variant="body"
                      color="textSecondary">
                      {line}
                    </AppText>
                  ))
              )}

              {answer.unavailable ? null : (
                <SourceLine label={policyChatSourceLabel(answer.source)} />
              )}

              {turn.degraded ? (
                <AppText variant="caption" color="textMuted">
                  {policyChatCopy.degraded}
                </AppText>
              ) : null}
            </AnswerCard>
          ))
        : null}

      {turn.status === 'failed' ? (
        <View style={styles.failure}>
          <Alert tone="error" message={policyChatCopy.failed} />
          <Button
            label={policyChatCopy.retry}
            variant="secondary"
            onPress={() => onRetry(turn.id)}
          />
        </View>
      ) : null}

      {turn.status === 'blocked' ? <Alert tone="error" message={policyChatCopy.rateLimited} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chatScreen: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  stateScreen: {
    paddingHorizontal: 0,
  },
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  headerText: {
    flex: 1,
    gap: spacing[1],
  },
  stateBody: {
    gap: spacing[3],
    marginTop: spacing[8],
    paddingHorizontal: layout.screenGutter,
  },
  list: {
    gap: spacing[4],
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  starters: {
    gap: spacing[2],
  },
  starterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  empty: {
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[8],
  },
  turn: {
    gap: spacing[2],
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  failure: {
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  composer: {
    gap: spacing[1],
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[3],
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
});
