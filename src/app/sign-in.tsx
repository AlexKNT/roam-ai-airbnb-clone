import { useAuth, useSignIn, useSignUp } from '@clerk/expo';
import { useSSO } from '@clerk/expo/experimental';
import { type Href, Redirect, router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AuthField } from '@/components/auth/auth-field';
import { GoogleMark } from '@/components/auth/google-mark';
import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Logo } from '@/components/ui/logo';
import { Screen } from '@/components/ui/screen';
import { authCopy, type AuthMode } from '@/constants/copy';
import { color, fontFamily, layout, spacing } from '@/theme';

type Step = 'credentials' | 'code';
type PendingReason = 'signup' | 'mfa';
type SsoStrategy = 'oauth_google' | 'oauth_apple';

function navigateAfterAuth({ decorateUrl }: { decorateUrl: (url: string) => string }) {
  const url = decorateUrl('/');

  if (url.startsWith('http')) {
    if (Platform.OS === 'web') window.location.href = url;
    return;
  }

  router.replace(url as Href);
}

/** Clerk and the browser session both throw, so one reader covers every failure. */
function describeError(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const detail = error as { longMessage?: unknown; message?: unknown };
    if (typeof detail.longMessage === 'string' && detail.longMessage.length > 0) {
      return detail.longMessage;
    }
    if (typeof detail.message === 'string' && detail.message.length > 0) return detail.message;
  }

  return fallback;
}

/** Clerk wraps API failures as `api_response_error`, with the real code inside `errors`. */
function hasClerkCode(error: unknown, code: string) {
  if (!error || typeof error !== 'object') return false;

  const detail = error as { code?: unknown; errors?: { code?: unknown }[] };
  if (detail.code === code) return true;

  return Array.isArray(detail.errors) && detail.errors.some((item) => item?.code === code);
}

export default function SignInScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const signInSignal = useSignIn();
  const signUpSignal = useSignUp();
  const { startSSOFlow } = useSSO();

  const [mode, setMode] = useState<AuthMode>('sign-up');
  const [step, setStep] = useState<Step>('credentials');
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingReason, setPendingReason] = useState<PendingReason>('signup');
  const [message, setMessage] = useState<string | null>(null);
  const [ssoBusy, setSsoBusy] = useState(false);

  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const busy =
    ssoBusy ||
    signInSignal.fetchStatus === 'fetching' ||
    signUpSignal.fetchStatus === 'fetching';

  const fieldMessage =
    message ??
    signInSignal.errors.fields.identifier?.message ??
    signInSignal.errors.fields.password?.message ??
    signInSignal.errors.fields.code?.message ??
    signUpSignal.errors.fields.emailAddress?.message ??
    signUpSignal.errors.fields.firstName?.message ??
    signUpSignal.errors.fields.lastName?.message ??
    signUpSignal.errors.fields.password?.message ??
    signUpSignal.errors.fields.code?.message ??
    signInSignal.errors.global?.[0]?.message ??
    signUpSignal.errors.global?.[0]?.message ??
    null;

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/" />;

  const signUpCopy = authCopy.modes['sign-up'];
  const copy = authCopy.modes[mode];
  const askingForCode = step === 'code';

  const startCodeStep = async (reason: PendingReason) => {
    const { error } =
      reason === 'signup'
        ? await signUpSignal.signUp.verifications.sendEmailCode()
        : await signInSignal.signIn.mfa.sendEmailCode();

    if (error) {
      setMessage(describeError(error, authCopy.messages.unsupported));
      return;
    }

    setPendingReason(reason);
    setStep('code');
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

    setMessage(authCopy.messages.unsupported);
  };

  const submitCredentials = async () => {
    setMessage(null);

    if (mode === 'sign-up') {
      const name = fullName.trim();

      if (name.length === 0) {
        setMessage(authCopy.messages.missingName);
        return;
      }

      if (password.length < 8) {
        setMessage(authCopy.messages.shortPassword);
        return;
      }

      const [firstName, ...rest] = name.split(/\s+/);
      const lastName = rest.join(' ');

      const { error } = await signUpSignal.signUp.password({
        emailAddress,
        password,
        firstName,
        ...(lastName.length > 0 ? { lastName } : {}),
      });

      if (error) {
        if (hasClerkCode(error, 'form_identifier_exists')) {
          setMode('sign-in');
          setMessage(authCopy.messages.accountExists);
          return;
        }

        setMessage(describeError(error, authCopy.messages.incomplete));
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

      setMessage(authCopy.messages.incomplete);
      return;
    }

    const { error } = await signInSignal.signIn.password({ emailAddress, password });
    if (!error) {
      await finishSignIn();
      return;
    }

    if (hasClerkCode(error, 'form_identifier_not_found')) {
      setMode('sign-up');
      setMessage(authCopy.messages.noAccount);
      return;
    }

    setMessage(describeError(error, authCopy.messages.unsupported));
  };

  const submitCode = async () => {
    setMessage(null);

    if (pendingReason === 'signup') {
      const { error } = await signUpSignal.signUp.verifications.verifyEmailCode({ code });
      if (error) {
        setMessage(describeError(error, authCopy.messages.unsupported));
        return;
      }

      if (signUpSignal.signUp.status === 'complete') {
        await signUpSignal.signUp.finalize({ navigate: navigateAfterAuth });
      } else {
        setMessage(authCopy.messages.verifiedIncomplete);
      }
      return;
    }

    const { error } = await signInSignal.signIn.mfa.verifyEmailCode({ code });
    if (error) {
      setMessage(describeError(error, authCopy.messages.unsupported));
      return;
    }

    await finishSignIn();
  };

  const continueWith = async (strategy: SsoStrategy) => {
    setMessage(null);
    setSsoBusy(true);

    try {
      const { createdSessionId, authSessionResult } = await startSSOFlow({ strategy });
      if (createdSessionId) return;

      // A closed or cancelled browser is the guest changing their mind, not a failure.
      const abandoned =
        authSessionResult?.type === 'cancel' || authSessionResult?.type === 'dismiss';
      if (!abandoned) setMessage(authCopy.messages.ssoFailed);
    } catch (error) {
      setMessage(describeError(error, authCopy.messages.ssoFailed));
    } finally {
      setSsoBusy(false);
    }
  };

  const restart = async () => {
    setMessage(null);
    setCode('');
    setStep('credentials');
    await signInSignal.signIn.reset();
    await signUpSignal.signUp.reset();
  };

  const switchMode = async (next: AuthMode) => {
    setMessage(null);
    setMode(next);
    // The resources keep errors from the mode just left, so clear them with it.
    await signInSignal.signIn.reset();
    await signUpSignal.signUp.reset();
  };

  const goBack = () => {
    if (step === 'code') {
      void restart();
      return;
    }

    void switchMode('sign-in');
  };

  const showBack = askingForCode || mode === 'sign-up';

  return (
    <Screen
      background="surface"
      bottomInset="none"
      keyboardInsets
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {showBack ? (
          <IconButton
            icon="chevron-back"
            label={authCopy.back}
            tone="outline"
            size={layout.touchTarget}
            disabled={busy}
            onPress={goBack}
          />
        ) : null}
        <Logo size={32} />
      </View>

      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {askingForCode ? authCopy.code.title : copy.title}
      </AppText>

      <AppText variant="bodyTight" color="textSecondary" style={styles.description}>
        {askingForCode ? authCopy.code.description(emailAddress) : copy.description}
      </AppText>

      <View style={styles.form}>
        {askingForCode ? (
          <>
            <AuthField
              label={authCopy.code.label}
              value={code}
              onChangeText={setCode}
              icon="key-outline"
              placeholder={authCopy.code.placeholder}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              disabled={busy}
              onSubmitEditing={submitCode}
            />

            <Button
              label={authCopy.code.submit}
              icon="arrow-forward"
              iconPlacement="edge"
              onPress={submitCode}
              disabled={busy || code.trim().length === 0}
              loading={busy}
              style={styles.action}
            />

            <View style={styles.linkRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={authCopy.code.resend}
                disabled={busy}
                onPress={() => startCodeStep(pendingReason)}
                hitSlop={spacing[2]}>
                <AppText variant="caption">{authCopy.code.resend}</AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={authCopy.code.startOver}
                disabled={busy}
                onPress={restart}
                hitSlop={spacing[2]}>
                <AppText variant="caption">{authCopy.code.startOver}</AppText>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {mode === 'sign-up' ? (
              <AuthField
                label={signUpCopy.nameLabel}
                value={fullName}
                onChangeText={setFullName}
                icon="person-outline"
                placeholder={signUpCopy.namePlaceholder}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                disabled={busy}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            ) : null}

            <AuthField
              ref={emailRef}
              label={copy.emailLabel}
              value={emailAddress}
              onChangeText={setEmailAddress}
              icon="mail-outline"
              placeholder={copy.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              disabled={busy}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <AuthField
              ref={passwordRef}
              label={copy.passwordLabel}
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              placeholder={copy.passwordPlaceholder}
              secure
              autoCapitalize="none"
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
              disabled={busy}
              onSubmitEditing={submitCredentials}
            />

            <Button
              label={copy.submit}
              icon="arrow-forward"
              iconPlacement="edge"
              onPress={submitCredentials}
              disabled={busy || emailAddress.trim().length === 0 || password.length === 0}
              loading={busy}
              style={styles.action}
            />
          </>
        )}

        {fieldMessage ? <Alert tone="error" message={fieldMessage} /> : null}
      </View>

      {askingForCode ? null : (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" color="textSecondary">
              {authCopy.or}
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socials}>
            <Button
              variant="secondary"
              label={authCopy.continueWithGoogle}
              leading={<GoogleMark />}
              onPress={() => continueWith('oauth_google')}
              disabled={busy}
              style={styles.social}
            />

            <Button
              variant="secondary"
              label={authCopy.continueWithApple}
              leading={<Icon name="logo-apple" size="md" color={color.textPrimary} />}
              onPress={() => continueWith('oauth_apple')}
              disabled={busy}
              style={styles.social}
            />
          </View>

          <View style={styles.footer}>
            <AppText variant="bodyTight" color="textSecondary">
              {copy.switchPrompt}
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.switchAction}
              onPress={() => switchMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}
              hitSlop={spacing[3]}>
              <AppText variant="bodyTight" style={styles.footerAction}>
                {copy.switchAction}
              </AppText>
            </Pressable>
          </View>
        </>
      )}

      <View nativeID="clerk-captcha" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[8],
    paddingTop: spacing[2],
  },
  header: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    marginTop: spacing[6],
  },
  description: {
    marginTop: spacing[2],
  },
  form: {
    marginTop: spacing[5],
    gap: spacing[3],
  },
  action: {
    height: layout.authActionHeight,
    marginTop: spacing[1],
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    marginTop: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: color.border,
  },
  socials: {
    marginTop: spacing[1],
    gap: spacing[3],
  },
  social: {
    height: layout.touchTarget,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing[8],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  footerAction: {
    fontFamily: fontFamily.semibold,
    color: color.textPrimary,
    textDecorationLine: 'underline',
  },
});
