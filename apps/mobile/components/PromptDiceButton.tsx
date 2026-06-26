import { useEffect, useMemo, useRef, useState } from "react";



import { StyleSheet } from "react-native";



import { Ionicons } from "@expo/vector-icons";



import * as Haptics from "expo-haptics";



import type { PromptMode } from "@producerhit/shared";



import { pickUnifiedDiceRoll } from "@producerhit/shared";



import type { AppLocale } from "@/lib/i18n/catalog";



import { devWarn } from "@/lib/devLog";



import { PressableScale } from "@/lib/reanimated/usePressScale";



import { useTheme } from "@/theme/ThemeProvider";







type Props = {



  locale: AppLocale;



  mode: PromptMode;



  accessibilityLabel?: string;



  onPick: (displayPrompt: string) => void;



  onPickAce: (acePrompt: string) => void;



  onPickLyrics?: (lyricsStructure: string) => void;



  onPickGenre?: (genre: string) => void;

  onDiceRolled?: () => void;

};







const ROLL_COOLDOWN_MS = 320;







export function PromptDiceButton({



  locale,



  mode,



  accessibilityLabel,



  onPick,



  onPickAce,



  onPickLyrics,



  onPickGenre,



  onDiceRolled,



}: Props) {



  const { colors, radius } = useTheme();



  const [rolling, setRolling] = useState(false);



  const rollLockedRef = useRef(false);



  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  const styles = useMemo(() => createStyles(colors, radius), [colors, radius]);







  useEffect(() => {



    return () => {



      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);



      rollLockedRef.current = false;



    };



  }, []);







  const releaseRoll = () => {



    rollLockedRef.current = false;



    setRolling(false);



  };







  const roll = () => {



    if (rollLockedRef.current) return;



    rollLockedRef.current = true;



    setRolling(true);



    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);







    try {



      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);



      const result = pickUnifiedDiceRoll(locale, mode);



      onPick(result.displayPrompt);



      onPickAce(result.acePrompt.trim());



      if (result.lyricsStructure?.trim()) onPickLyrics?.(result.lyricsStructure.trim());
      else onPickLyrics?.("");



      if (result.genre && onPickGenre) onPickGenre(result.genre);



      onDiceRolled?.();



    } catch (e) {



      devWarn("[PromptDiceButton] roll failed", e);



      releaseRoll();



      return;



    }







    cooldownTimerRef.current = setTimeout(releaseRoll, ROLL_COOLDOWN_MS);



  };







  return (



    <PressableScale



      onPress={roll}



      style={[styles.btn, rolling && styles.rolling]}



      hitSlop={8}



      accessibilityRole="button"



      accessibilityLabel={accessibilityLabel}



    >



      <Ionicons name="dice-outline" size={22} color={colors.pillActiveText} />



    </PressableScale>



  );



}







function createStyles(colors: ReturnType<typeof useTheme>["colors"], radius: ReturnType<typeof useTheme>["radius"]) {



  return StyleSheet.create({



    btn: {



      width: 40,



      height: 40,



      borderRadius: radius.md,



      alignItems: "center",



      justifyContent: "center",



      backgroundColor: colors.bgElevated,



      borderWidth: StyleSheet.hairlineWidth,



      borderColor: colors.surfaceBorder,



    },



    rolling: { opacity: 0.7, transform: [{ rotate: "12deg" }] },



  });



}


