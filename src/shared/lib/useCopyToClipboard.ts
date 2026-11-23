import { useToast } from "@/shared/ui/Toast";

/** Returns `copy(text, message)`: writes the text to the clipboard and shows
 * a confirmation toast. The toast is shown even where the Clipboard API is
 * unavailable, matching the behavior the Library row menu always had. */
export function useCopyToClipboard() {
  const { show } = useToast();

  return function copy(text: string, message: string) {
    void navigator.clipboard?.writeText(text);
    show(message);
  };
}
