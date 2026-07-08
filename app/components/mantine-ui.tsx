"use client";

import {
  ActionIcon,
  Button as MantineButton,
  Card as MantineCard,
  Modal,
  Popover,
  Select,
  Switch as MantineSwitch,
  TextInput,
} from "@mantine/core";
import {
  ArrowLeft,
  ArrowUp,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock3,
  CloudUpload,
  CreditCard,
  Database,
  Download,
  Edit3,
  Eye,
  FileUp,
  Filter,
  Home,
  KeyRound,
  Layers,
  LayoutDashboard,
  LineChart,
  MapPin,
  Package,
  Pause,
  PieChart,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  StopCircle,
  Table2,
  Trash2,
  TrendingUp,
  User,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ChangeEventHandler,
  ComponentType,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export const Elevation = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
} as const;

export type IconName =
  | "arrow-left"
  | "bank-account"
  | "barcode"
  | "blank"
  | "box"
  | "calendar"
  | "camera"
  | "caret-down"
  | "chart"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "cloud-upload"
  | "comparison"
  | "credit-card"
  | "cross"
  | "cube"
  | "dashboard"
  | "database"
  | "document-open"
  | "dollar"
  | "download"
  | "edit"
  | "eye-open"
  | "filter"
  | "filter-remove"
  | "grouped-bar-chart"
  | "home"
  | "key"
  | "layers"
  | "map-marker"
  | "numerical"
  | "office"
  | "pause"
  | "people"
  | "person"
  | "pie-chart"
  | "plus"
  | "predictive-analysis"
  | "search"
  | "series-derived"
  | "shopping-cart"
  | "star"
  | "stop"
  | "th"
  | "tick"
  | "tick-circle"
  | "time"
  | "timeline-area-chart"
  | "timeline-line-chart"
  | "trash"
  | "user"
  | "warning-sign";

const icons: Partial<Record<IconName, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>>> = {
  "arrow-left": ArrowLeft,
  "bank-account": Banknote,
  barcode: ScanIcon,
  box: Package,
  calendar: Calendar,
  camera: Camera,
  "caret-down": ChevronDown,
  chart: BarChart3,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "cloud-upload": CloudUpload,
  comparison: TrendingUp,
  "credit-card": CreditCard,
  cross: X,
  cube: Package,
  dashboard: LayoutDashboard,
  database: Database,
  "document-open": FileUp,
  dollar: BadgeDollarSign,
  download: Download,
  edit: Edit3,
  "eye-open": Eye,
  filter: Filter,
  "filter-remove": X,
  "grouped-bar-chart": BarChart3,
  home: Home,
  key: KeyRound,
  layers: Layers,
  "map-marker": MapPin,
  numerical: HashIcon,
  office: BriefcaseBusiness,
  pause: Pause,
  people: Users,
  person: User,
  "pie-chart": PieChart,
  plus: Plus,
  "predictive-analysis": WandSparkles,
  search: Search,
  "series-derived": LineChart,
  "shopping-cart": ShoppingCart,
  star: Sparkles,
  stop: StopCircle,
  th: Table2,
  tick: Check,
  "tick-circle": CheckCircle2,
  time: Clock3,
  "timeline-area-chart": BarChart3,
  "timeline-line-chart": LineChart,
  trash: Trash2,
  user: User,
  "warning-sign": AlertIcon,
};

function ScanIcon(props: React.ComponentProps<"svg">) {
  return <Circle {...props} />;
}

function HashIcon() {
  return <span style={{ fontWeight: 700, lineHeight: 1 }}>#</span>;
}

function AlertIcon(props: React.ComponentProps<"svg">) {
  return <ArrowUp {...props} />;
}

function renderIcon(icon?: IconName | ReactNode, size = 16) {
  if (!icon) {
    return undefined;
  }

  if (typeof icon !== "string") {
    return icon;
  }

  if (icon === "blank") {
    return <span aria-hidden style={{ display: "inline-block", width: size, height: size }} />;
  }

  const IconComponent = icons[icon as IconName] ?? Circle;
  return <IconComponent size={size} strokeWidth={2} aria-hidden />;
}

export function Icon({ icon, size = 16 }: { icon: IconName; size?: number }) {
  return renderIcon(icon, size);
}

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  icon?: IconName | ReactNode;
  rightIcon?: IconName | ReactNode;
  intent?: "primary" | "success" | "warning" | "danger";
  minimal?: boolean;
  outlined?: boolean;
  small?: boolean;
  text?: ReactNode;
  children?: ReactNode;
  color?: string;
};

export function Button({
  icon,
  rightIcon,
  intent,
  minimal,
  outlined,
  small,
  text,
  children,
  color,
  ...props
}: ButtonProps) {
  const iconOnly = icon && !rightIcon && !text && !children;
  const variant = minimal ? "subtle" : outlined ? "outline" : undefined;
  const buttonColor =
    color ??
    (intent === "danger"
      ? "red"
      : intent === "success"
        ? "green"
        : intent === "warning"
          ? "yellow"
          : intent === "primary"
            ? "blue"
            : undefined);

  if (iconOnly) {
    return (
      <ActionIcon
        aria-label={props["aria-label"]}
        color={buttonColor}
        disabled={props.disabled}
        onClick={props.onClick}
        size={small ? 30 : 36}
        title={props.title}
        type={props.type}
        variant={variant ?? "subtle"}
      >
        {renderIcon(icon, small ? 16 : 18)}
      </ActionIcon>
    );
  }

  return (
    <MantineButton
      color={buttonColor}
      leftSection={renderIcon(icon)}
      rightSection={renderIcon(rightIcon)}
      size={small ? "xs" : "sm"}
      variant={variant}
      {...props}
    >
      {text ?? children}
    </MantineButton>
  );
}

export function Card({
  children,
  className,
  style,
  ...props
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  elevation?: number;
  dir?: string;
}) {
  return (
    <MantineCard className={className} style={style} shadow="xs" withBorder {...props}>
      {children}
    </MantineCard>
  );
}

export function H1(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 {...props} />;
}

export function H2(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} />;
}

export function H3(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} />;
}

export function InputGroup({
  leftIcon,
  rightElement,
  onValueChange,
  onChange,
  fill,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  leftIcon?: IconName;
  rightElement?: ReactNode;
  onValueChange?: (value: string) => void;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  fill?: boolean;
}) {
  return (
    <TextInput
      leftSection={renderIcon(leftIcon)}
      rightSection={rightElement}
      style={fill ? { width: "100%", ...props.style } : props.style}
      onChange={(event) => {
        onValueChange?.(event.currentTarget.value);
        onChange?.(event);
      }}
      {...props}
    />
  );
}

export function HTMLSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: string[] | { label: string; value: string }[];
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
}) {
  const data = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );

  return (
    <Select
      className={className}
      data={data}
      value={value}
      allowDeselect={false}
      onChange={(nextValue) => {
        if (nextValue === null) {
          return;
        }
        onChange({
          currentTarget: { value: nextValue },
          target: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
    />
  );
}

export function Menu({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="mantine-menu-list"
      style={{
        display: "flex",
        minWidth: 220,
        maxHeight: 320,
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function MenuItem({
  text,
  icon,
  onClick,
}: {
  text: ReactNode;
  icon?: IconName;
  shouldDismissPopover?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="mantine-menu-item"
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
      }}
    >
      {renderIcon(icon, 15)}
      <span>{text}</span>
    </button>
  );
}

export function PopoverNext({
  children,
  content,
  placement,
}: {
  children: ReactNode;
  content: ReactNode;
  placement?: string;
}) {
  return (
    <Popover position={placement?.includes("end") ? "bottom-end" : "bottom"} shadow="md" withinPortal>
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown p={4} style={{ minWidth: 220 }}>
        {content}
      </Popover.Dropdown>
    </Popover>
  );
}

export function Overlay2({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  hasBackdrop?: boolean;
  canEscapeKeyClose?: boolean;
  canOutsideClickClose?: boolean;
}) {
  return (
    <Modal opened={isOpen} onClose={onClose} centered withCloseButton={false} size="auto">
      {children}
    </Modal>
  );
}

export function Dialog({
  isOpen,
  onClose,
  title,
  icon,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        title ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {renderIcon(icon)}
            {title}
          </span>
        ) : undefined
      }
      size="xl"
      centered
    >
      {children}
    </Modal>
  );
}

export function Switch({
  checked,
  label,
  onChange,
  className,
}: {
  checked: boolean;
  label: ReactNode;
  onChange: () => void;
  className?: string;
}) {
  return (
    <MantineSwitch className={className} checked={checked} label={label} onChange={onChange} />
  );
}
