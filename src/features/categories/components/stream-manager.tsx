import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FuwariModal } from "@/components/ui/fuwari-modal";
import { handleORPCError } from "@/lib/orpc/error-handler";
import { orpc, orpcClient } from "@/lib/orpc";
import { m } from "@/paraglide/messages";

/**
 * Compact CRUD dialog for 内容归属 (streams). Slugs are wiring to public
 * pages, so they are generated server-side and never editable here; the two
 * built-in streams (news/policy) refuse deletion.
 */
export function StreamManager({
  open,
  onClose,
  fallbackFocus,
}: {
  open: boolean;
  onClose: () => void;
  fallbackFocus?: () => HTMLElement | null;
}) {
  const queryClient = useQueryClient();
  const streamsQuery = useQuery({
    ...orpc.categories.admin.streams.list.queryOptions(),
    enabled: open,
    refetchOnMount: "always",
  });
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: orpc.categories.key() }),
      queryClient.invalidateQueries({ queryKey: orpc.posts.list.key() }),
    ]);

  useEffect(() => {
    if (!open) {
      setName("");
      setRenaming(null);
    }
  }, [open]);

  const errorToast = (error: unknown) =>
    handleORPCError(error, {
      defined: {
        STREAM_NAME_ALREADY_EXISTS: () =>
          toast.error(m.stream_name_exists()),
        STREAM_RESERVED: () => toast.error(m.stream_reserved()),
        STREAM_IN_USE: () => toast.error(m.stream_in_use()),
        STREAM_NOT_FOUND: () => toast.error(m.stream_unknown_error()),
      },
      fallback: () => toast.error(m.stream_unknown_error()),
    });

  const createMutation = useMutation({
    mutationFn: (nextName: string) =>
      orpcClient.categories.admin.streams.create({ name: nextName }),
    onSuccess: async () => {
      await invalidate();
      setName("");
      toast.success(m.stream_created());
    },
    onError: errorToast,
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; name: string }) =>
      orpcClient.categories.admin.streams.update({
        id: input.id,
        data: { name: input.name },
      }),
    onSuccess: async () => {
      await invalidate();
      setRenaming(null);
      toast.success(m.stream_renamed());
    },
    onError: errorToast,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      orpcClient.categories.admin.streams.remove({ id }),
    onSuccess: async () => {
      await invalidate();
      toast.success(m.stream_deleted());
    },
    onError: errorToast,
  });

  const streams = streamsQuery.data ?? [];
  const busy =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <FuwariModal
      open={open}
      onClose={onClose}
      busy={busy}
      label={m.stream_manager_title()}
      fallbackFocus={fallbackFocus}
      className="taxonomy-name-dialog"
    >
      <header>
        <h2>{m.stream_manager_title()}</h2>
        <button
          type="button"
          aria-label={m.common_close()}
          disabled={busy}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>
      <p>{m.stream_manager_hint()}</p>
      <ul className="stream-list">
        {streams.map((stream) => (
          <li key={stream.id} className="stream-row">
            {renaming?.id === stream.id ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const next = renaming.name.trim();
                  if (next && next !== stream.name && !busy) {
                    updateMutation.mutate({ id: stream.id, name: next });
                  } else {
                    setRenaming(null);
                  }
                }}
              >
                <input
                  autoFocus
                  value={renaming.name}
                  disabled={busy}
                  onChange={(event) =>
                    setRenaming({ id: stream.id, name: event.target.value })
                  }
                />
              </form>
            ) : (
              <>
                <button
                  type="button"
                  className="stream-name"
                  disabled={busy}
                  onClick={() => setRenaming({ id: stream.id, name: stream.name })}
                  title={m.stream_manager_rename_hint()}
                >
                  {stream.name}
                  <small>{stream.slug}</small>
                </button>
                <button
                  type="button"
                  className="taxonomy-delete"
                  disabled={busy}
                  onClick={() => {
                    if (!busy) deleteMutation.mutate(stream.id);
                  }}
                >
                  {m.category_manager_delete()}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form
        className="stream-add"
        onSubmit={(event) => {
          event.preventDefault();
          const next = name.trim();
          if (next && !busy) createMutation.mutate(next);
        }}
      >
        <input
          value={name}
          maxLength={50}
          placeholder={m.stream_add_placeholder()}
          disabled={busy}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
        />
        <button
          type="submit"
          className="fuwari-btn-regular"
          disabled={busy || !name.trim()}
        >
          {m.stream_add()}
        </button>
      </form>
    </FuwariModal>
  );
}
