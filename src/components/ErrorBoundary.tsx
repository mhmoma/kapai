import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SpireStormBackdrop } from './PixelSprites';

interface ErrorBoundaryProps {
  children: ReactNode;
  onResetToMenu?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[PixelSpire ErrorBoundary] 捕获到组件渲染异常:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReturnToMenu = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onResetToMenu) {
      this.props.onResetToMenu();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="relative flex-1 min-h-screen w-full flex items-center justify-center p-6 overflow-hidden select-none bg-[#0b111e] text-slate-100">
          <SpireStormBackdrop variant="ui" />

          <div className="relative z-10 max-w-xl w-full pixel-panel-gold p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.95)]">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#1a0f16] border-2 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.45)]">
              <span className="text-3xl">⚠️</span>
            </div>

            <div className="text-[11px] font-black text-rose-400 tracking-[0.25em] uppercase mb-1">
              SPIRE ANOMALY DETECTED
            </div>
            <h2 className="text-2xl sm:text-3xl font-black spire-title-gold tracking-wider mb-3">
              尖塔时空乱流 · 渲染异常已拦截
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
              当前战斗或房间舞台在渲染时遇到了意外波动，错误边界已自动保护您的应用免于崩溃。您可以尝试重新加载当前界面，或安全返回选角大厅。
            </p>

            {this.state.error && (
              <div className="mb-6 p-3.5 bg-slate-950/95 border border-rose-500/40 text-left overflow-auto max-h-36">
                <div className="text-[11px] font-black text-rose-300 mb-1">
                  异常信息：{this.state.error.name || 'Error'}
                </div>
                <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {this.state.error.message || '未知渲染错误'}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-7 py-3 spire-ribbon-btn-teal text-xs sm:text-sm font-black tracking-widest cursor-pointer"
              >
                🔄 重试恢复当前界面
              </button>

              {this.props.onResetToMenu && (
                <button
                  type="button"
                  onClick={this.handleReturnToMenu}
                  className="px-7 py-3 spire-ribbon-btn text-xs sm:text-sm font-black tracking-widest cursor-pointer"
                >
                  ◀ 返回选角大厅
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
