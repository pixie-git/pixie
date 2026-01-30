import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ModalType = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ModalType;
}

export const useModalStore = defineStore('modal', () => {
    const isOpen = ref(false);
    const title = ref('');
    const message = ref('');
    const confirmText = ref('Confirm');
    const cancelText = ref('Cancel');
    const type = ref<ModalType>('info');

    // Holds the resolve function of the active promise
    let resolvePromise: ((value: boolean) => void) | null = null;

    const confirm = (options: ConfirmOptions): Promise<boolean> => {
        title.value = options.title;
        message.value = options.message;
        confirmText.value = options.confirmText || 'Confirm';
        cancelText.value = options.cancelText || 'Cancel';
        type.value = options.type || 'info';
        isOpen.value = true;

        return new Promise((resolve) => {
            resolvePromise = resolve;
        });
    };

    const handleConfirm = () => {
        isOpen.value = false;
        if (resolvePromise) {
            resolvePromise(true);
            resolvePromise = null;
        }
    };

    const handleCancel = () => {
        isOpen.value = false;
        if (resolvePromise) {
            resolvePromise(false);
            resolvePromise = null;
        }
    };

    return {
        isOpen,
        title,
        message,
        confirmText,
        cancelText,
        type,
        confirm,
        handleConfirm,
        handleCancel
    };
});
