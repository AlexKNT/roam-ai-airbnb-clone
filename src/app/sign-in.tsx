import { useAuth, useSignIn, useSignUp } from '@clerk/expo';
import { type Href, Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { Screen } from '@/components/ui/screen';
import { signInCopy } from '@/constants/copy';
import { color, layout, radius, spacing } from '@/theme';

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
    <Screen bottomInset="none" scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.heading}>
              <Logo size={48} />
              <AppText variant="heading">
                {askingForCode ? signInCopy.codeTitle : signInCopy.heading}
              </AppText>
              <AppText variant="body" color="textSecondary">
                {askingForCode
                  ? signInCopy.codeDescription(emailAddress)
                  : signInCopy.description}
              </AppText>
            </View>

            {askingForCode ? (
              <View style={styles.form}>
                <Input
                  value={code}
                  onChangeText={setCode}
                  label={signInCopy.codeLabel}
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  disabled={busy}
                />

                <Button
                  label={signInCopy.verify}
                  onPress={submitCode}
                  disabled={busy || code.trim().length === 0}
                  loading={busy}
                  icon="arrow-forward"
                />

                <View style={styles.footerRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={signInCopy.resend}
                    disabled={busy}
                    onPress={() => startCodeStep(pendingReason)}>
                    <AppText variant="caption">{signInCopy.resend}</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={signInCopy.startOver}
                    disabled={busy}
                    onPress={restart}>
                    <AppText variant="caption">{signInCopy.startOver}</AppText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <Input
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  label={signInCopy.emailLabel}
                  placeholder="you@example.com"
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  disabled={busy}
                />

                <Input
                  value={password}
                  onChangeText={setPassword}
                  label={signInCopy.passwordLabel}
                  placeholder="Your password"
                  icon="lock-closed-outline"
                  secure
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  disabled={busy}
                  onSubmitEditing={submitCredentials}
                />

                <Button
                  label={signInCopy.submit}
                  onPress={submitCredentials}
                  disabled={busy || emailAddress.trim().length === 0 || password.length === 0}
                  loading={busy}
                  icon="arrow-forward"
                />

                <AppText variant="caption" color="textSecondary">
                  {signInCopy.newAccountNote}
                </AppText>
              </View>
            )}

            {fieldMessage ? <Alert tone="error" message={fieldMessage} /> : null}

            <View nativeID="clerk-captcha" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing[6],
  },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: layout.formMaxWidth,
    gap: spacing[6],
    padding: spacing[6],
    backgroundColor: color.surface,
    borderRadius: radius.xl,
  },
  heading: {
    gap: spacing[2],
  },
  form: {
    gap: spacing[4],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
