// ESC/POS Command Generator and Thermal Print Engine

export interface ESCPOSReceiptData {
  storeName?: string;
  storeSub?: string;
  orderId?: string;
  staffName?: string;
  dateStr?: string;
  timeStr?: string;
  items: { name: string; price: number; sub?: string }[];
  totalAmount: number;
  paymentMethod: string;
  footerNote?: string;
}

export class ESCPOSBuilder {
  private buffer: number[] = [];

  constructor() {
    this.reset();
  }

  // Initialize / Reset printer
  public reset(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  // Alignment: 'left' | 'center' | 'right'
  public align(alignment: 'left' | 'center' | 'right'): this {
    const code = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, code); // ESC a n
    return this;
  }

  // Bold text
  public bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0); // ESC E n
    return this;
  }

  // Font Size: double width & double height
  public size(mode: 'normal' | 'double-height' | 'double-width' | 'double'): this {
    let code = 0x00;
    if (mode === 'double-height') code = 0x01;
    if (mode === 'double-width') code = 0x10;
    if (mode === 'double') code = 0x11;
    this.buffer.push(0x1d, 0x21, code); // GS ! n
    return this;
  }

  // Add text string
  public text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  // Line feed
  public line(str: string = ''): this {
    if (str) this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  public feed(lines: number = 1): this {
    this.buffer.push(0x1b, 0x64, lines); // ESC d n
    return this;
  }

  // 2-column row (e.g. Item Name Left, Price Right, total 32 or 48 chars)
  public row(left: string, right: string, width: number = 42): this {
    const rightLen = right.length;
    const maxLeftLen = width - rightLen - 1;
    const truncatedLeft = left.length > maxLeftLen ? left.substring(0, maxLeftLen - 1) + '…' : left;
    const spaces = Math.max(1, width - truncatedLeft.length - rightLen);
    this.line(truncatedLeft + ' '.repeat(spaces) + right);
    return this;
  }

  // Dashed separator line
  public divider(width: number = 42): this {
    this.line('-'.repeat(width));
    return this;
  }

  // Cut paper (Partial / Full)
  public cut(): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, 0x41, 0x00); // GS V A 0 (Full Cut)
    return this;
  }

  // Open / Kick cash drawer connected to printer RJ11 port
  public openDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  public getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// Generate Standard 80mm ESC/POS Binary Receipt
export function generateThermalReceiptBytes(data: ESCPOSReceiptData): Uint8Array {
  const builder = new ESCPOSBuilder();

  // Header
  builder
    .align('center')
    .size('double')
    .bold(true)
    .line(data.storeName || 'UDHYANA GAMES')
    .size('normal')
    .bold(false)
    .line(data.storeSub || 'Official POS Receipt')
    .divider()
    .align('left')
    .row(`Date: ${data.dateStr || new Date().toLocaleDateString()}`, `Time: ${data.timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
    .row(`Cashier: ${data.staffName || 'Staff'}`, data.orderId ? `#${data.orderId.slice(-6)}` : '')
    .divider();

  // Items
  builder.bold(true).row('ITEM', 'AMOUNT (PKR)').bold(false);
  builder.divider();

  for (const item of data.items) {
    builder.row(item.name, item.price.toString());
    if (item.sub) {
      builder.line(`  Station: ${item.sub}`);
    }
  }

  // Total
  builder
    .divider()
    .bold(true)
    .size('double-height')
    .row('TOTAL PAYABLE:', `PKR ${data.totalAmount}`)
    .size('normal')
    .bold(false)
    .row('Payment Method:', data.paymentMethod.toUpperCase())
    .divider();

  // Footer
  builder
    .align('center')
    .line(data.footerNote || 'Thank you for playing with us!')
    .line('Please retain slip for station verification.')
    .cut();

  return builder.getBytes();
}

// Direct Web Serial API Printing (Direct USB / Serial Thermal Printer)
export async function printDirectWebSerial(bytes: Uint8Array): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('Web Serial API is not supported in this browser. Use Chrome/Edge on Desktop.');
  }

  try {
    interface SerialPortLike {
      open: (options: { baudRate: number }) => Promise<void>;
      writable: {
        getWriter: () => {
          write: (data: Uint8Array) => Promise<void>;
          releaseLock: () => void;
        };
      };
      close: () => Promise<void>;
    }
    const nav = navigator as unknown as { serial: { requestPort: () => Promise<SerialPortLike> } };
    const port = await nav.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
    await port.close();
    return true;
  } catch (err: unknown) {
    console.error('Web Serial Print Error:', err);
    throw err;
  }
}
