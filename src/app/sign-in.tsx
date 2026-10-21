import { useAuth, useSignIn, useSignUp } from '@clerk/expo';
import { type Href, Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PendingReason = 'signup' | 'mfa';

function navigateAfterAuth({ decorateUrl }: { decorateUrl: (url: string) => string }) {
  const url = decorateUrl('/');

  if (url.startsWith('http')) {
    if (Platform.OS === 'web') window.location.href = url;
    return;
  }

  router.replace(url as Href);
}

export default function SignInScreen() {
  const theme = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  const signInSignal = useSignIn();
  const signUpSignal = useSignUp();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingReason, setPendingReason] = useState<PendingReason>('signup');
  const [askingForCode, setAskingForCode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const busy =
    signInSignal.fetchStatus === 'fetching' || signUpSignal.fetchStatus === 'fetching';

  const fieldMessage =
    message ??
    signInSignal.errors.fields.identifier?.message ??
    signInSignal.errors.fields.password?.message ??
    signInSignal.errors.fields.code?.message ??
    signUpSignal.errors.fields.emailAddress?.message ??
    signUpSignal.errors.fields.password?.message ??
    signUpSignal.errors.fields.code?.message ??
    signInSignal.errors.global?.[0]?.message ??
    signUpSignal.errors.global?.[0]?.message ??
    null;

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/" />;

  const startCodeStep = async (reason: PendingReason) => {
    const { error } =
      reason === 'signup'
        ? await signUpSignal.signUp.verifications.sendEmailCode()
        : await signInSignal.signIn.mfa.sendEmailCode();

    if (error) {
      setMessage(error.longMessage ?? error.message);
      return;
    }

    setPendingReason(reason);
    setAskingForCode(true);
  };

  const finishSignIn = async () => {
    const { signIn } = signInSignal;

    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: navigateAfterAuth });
      return;
    }

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      await startCodeStep('mfa');
      return;
    }

    setMessage('This account needs a sign-in step Roam does not support yet. Contact support.');
  };

  const submitCredentials = async () => {
    setMessage(null);

    const { error } = await signInSignal.signIn.password({ emailAddress, password });
    if (!error) {
      await finishSignIn();
      return;
    }

    if (error.code !== 'form_identifier_not_found') {
      setMessage(error.longMessage ?? error.message);
      return;
    }

    const { error: signUpError } = await signUpSignal.signUp.password({ emailAddress, password });
    if (signUpError) {
      setMessage(signUpError.longMessage ?? signUpError.message);
      return;
    }

    const { signUp } = signUpSignal;
    if (signUp.status === 'complete') {
      await signUp.finalize({ navigate: navigateAfterAuth });
      return;
    }

    if (signUp.unverifiedFields.includes('email_address')) {
      await startCodeStep('signup');
      return;
    }

    setMessage('Your account needs more information to finish. Contact support.');
  };

  const submitCode = async () => {
    setMessage(null);

    if (pendingReason === 'signup') {
      const { error } = await signUpSignal.signUp.verifications.verifyEmailCode({ code });
      if (error) {
        setMessage(error.longMessage ?? error.message);
        return;
      }

      if (signUpSignal.signUp.status === 'complete') {
        await signUpSignal.signUp.finalize({ navigate: navigateAfterAuth });
      } else {
        setMessage('Email verified, but your account still needs more information.');
      }
      return;
    }

    const { error } = await signInSignal.signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setMessage(error.longMessage ?? error.message);
      return;
    }

    await finishSignIn();
  };

  const restart = async () => {
    setMessage(null);
    setCode('');
    setAskingForCode(false);
    await signInSignal.signIn.reset();
    await signUpSignal.signUp.reset();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.heading}>
            <ThemedText type="subtitle">Roam</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {askingForCode
                ? `Enter the code we sent to ${emailAddress}.`
                : 'Sign in, or create an account with your email.'}
            </ThemedText>
          </View>

          {askingForCode ? (
            <View style={styles.form}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Verification code"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                editable={!busy}
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />

              <Pressable
                accessibilityRole="button"
                disabled={busy || code.trim().length === 0}
                onPress={submitCode}
                style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.5 : 1 }]}>
                {busy ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <ThemedText type="smallBold" style={{ color: theme.background }}>
                    Verify code
                  </ThemedText>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => startCodeStep(pendingReason)}>
                  <ThemedText type="linkPrimary">Resend code</ThemedText>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={busy} onPress={restart}>
                  <ThemedText type="linkPrimary">Start over</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="Email address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!busy}
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                editable={!busy}
                onSubmitEditing={submitCredentials}
                style={[
                  styles.input,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />

              <Pressable
                accessibilityRole="button"
                disabled={busy || emailAddress.trim().length === 0 || password.length === 0}
                onPress={submitCredentials}
                style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.5 : 1 }]}>
                {busy ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <ThemedText type="smallBold" style={{ color: theme.background }}>
                    Continue
                  </ThemedText>
                )}
              </Pressable>

              <ThemedText type="small" themeColor="textSecondary">
                New to Roam? The same form creates your account.
              </ThemedText>
            </View>
          )}

          {fieldMessage ? (
            <ThemedText type="small" style={{ color: '#D93F3F' }}>
              {fieldMessage}
            </ThemedText>
          ) : null}

          <View nativeID="clerk-captcha" />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  heading: {
    gap: Spacing.two,
  },
  form: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
