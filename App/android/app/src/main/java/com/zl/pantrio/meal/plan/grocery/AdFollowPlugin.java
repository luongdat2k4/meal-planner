package com.zl.pantrio.meal.plan.grocery;

import android.graphics.Rect;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Keeps an AppLovin MREC glued to the page while the page scrolls.
 *
 * The MREC is an Android view above the WebView, so it does not scroll with the page. Sending its position from JS on
 * every scroll frame reaches Android 50-65 ms after the page has moved, which looks like the ad is dragged on a string.
 * Instead JS sends the ad's position inside the page once, and this class moves the view in the frame that is being
 * drawn (onPreDraw), reading the same scroll value the page is drawn with.
 *
 * Where the ad runs under a fixed bar (the title bar, the tab bar) it is clipped there like any row of the page, and an
 * empty view over each clipped part passes taps down to the page, so nobody taps the ad through the bar by accident.
 *
 * Only the document's scroll is visible to Android (WebView.getScrollY()); a scroll box inside the page is not.
 * So this works for screens that scroll on the document, and JS does not use it for the others.
 */
@CapacitorPlugin(name = "AdFollow")
public class AdFollowPlugin extends Plugin {
    private static final int MREC_HEIGHT_DP = 250;

    private static final class Target {
        float pageTop;
        float clipTop = -1;
        float clipBottom = -1;
        // True while this class has hidden the view because it is outside the allowed band.
        boolean hiddenByFollow;
        // Cover the parts of the ad that are clipped; empty views that hand taps to the page.
        View coverAbove;
        View coverBelow;
        int clipFrom = -1;
        int clipTo = -1;
    }

    private final Map<String, Target> targets = new HashMap<>();
    private ViewTreeObserver.OnPreDrawListener listener;

    @PluginMethod
    public void follow(final PluginCall call) {
        final String unit = call.getString("adUnitId");
        if (unit == null || unit.isEmpty()) {
            call.reject("adUnitId is required");
            return;
        }
        final double pageTop = call.getDouble("pageTop", 0d);
        final double clipTop = call.getDouble("clipTop", -1d);
        final double clipBottom = call.getDouble("clipBottom", -1d);
        getActivity().runOnUiThread(() -> {
            float d = density();
            Target target = targets.get(unit);
            if (target == null) {
                target = new Target();
                targets.put(unit, target);
            }
            target.pageTop = (float) (pageTop * d);
            target.clipTop = clipTop < 0 ? -1 : (float) (clipTop * d);
            target.clipBottom = clipBottom < 0 ? -1 : (float) (clipBottom * d);
            if (listener == null) {
                listener = () -> {
                    apply();
                    return true;
                };
                getBridge().getWebView().getViewTreeObserver().addOnPreDrawListener(listener);
            }
            apply();
            call.resolve();
        });
    }

    @PluginMethod
    public void unfollow(final PluginCall call) {
        final String unit = call.getString("adUnitId");
        getActivity().runOnUiThread(() -> {
            Target target = unit == null ? null : targets.remove(unit);
            if (target != null) {
                View view = find(unit);
                if (view != null) {
                    view.setTranslationY(0);
                    view.setClipBounds(null);
                    if (target.hiddenByFollow && view.getVisibility() == View.INVISIBLE) view.setVisibility(View.VISIBLE);
                }
                removeCover(target.coverAbove);
                removeCover(target.coverBelow);
            }
            if (targets.isEmpty() && listener != null) {
                getBridge().getWebView().getViewTreeObserver().removeOnPreDrawListener(listener);
                listener = null;
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (listener != null) {
            getBridge().getWebView().getViewTreeObserver().removeOnPreDrawListener(listener);
            listener = null;
        }
        targets.clear();
    }

    // Runs just before every frame: the ad and the page use the same scroll value.
    private void apply() {
        int scroll = getBridge().getWebView().getScrollY();
        for (Iterator<Map.Entry<String, Target>> it = targets.entrySet().iterator(); it.hasNext(); ) {
            Map.Entry<String, Target> entry = it.next();
            View view = find(entry.getKey());
            if (view == null || !(view.getLayoutParams() instanceof FrameLayout.LayoutParams)) continue;
            Target target = entry.getValue();
            int margin = ((FrameLayout.LayoutParams) view.getLayoutParams()).topMargin;
            float top = target.pageTop - scroll;
            float y = Math.round(top) - margin;
            if (view.getTranslationY() != y) view.setTranslationY(y);

            // Only the part of the ad between the fixed bars is shown; a part under a bar is clipped off, and an ad
            // with nothing left in the band is hidden.
            int w = view.getWidth();
            int h = view.getHeight() > 0 ? view.getHeight() : Math.round(MREC_HEIGHT_DP * density());
            int from = target.clipTop < 0 ? 0 : Math.max(0, Math.round(target.clipTop - top));
            int to = target.clipBottom < 0 ? h : Math.min(h, Math.round(target.clipBottom - top));
            boolean visible = to - from > 0 && w > 0;
            int visibility = view.getVisibility();
            if (!visible && visibility == View.VISIBLE) {
                view.setVisibility(View.INVISIBLE);
                target.hiddenByFollow = true;
            } else if (visible && target.hiddenByFollow && visibility == View.INVISIBLE) {
                view.setVisibility(View.VISIBLE);
                target.hiddenByFollow = false;
            } else if (visibility == View.GONE) {
                // JS hid it on purpose; do not bring it back.
                target.hiddenByFollow = false;
            }
            clip(view, target, w, h, visible ? from : 0, visible ? to : h, Math.round(top), visible && view.getVisibility() == View.VISIBLE);
        }
    }

    // Clips the ad to rows [from, to) and keeps a tap-catching view over each clipped part.
    private void clip(View ad, Target target, int w, int h, int from, int to, int adTop, boolean active) {
        if (!active || (from <= 0 && to >= h)) {
            if (target.clipFrom != -1 || target.clipTo != -1) {
                ad.setClipBounds(null);
                target.clipFrom = -1;
                target.clipTo = -1;
            }
            place(target, ad, 0, 0, 0, 0);
            return;
        }
        if (from != target.clipFrom || to != target.clipTo) {
            ad.setClipBounds(new Rect(0, from, w, to));
            target.clipFrom = from;
            target.clipTo = to;
        }
        place(target, ad, w, from, h - to, adTop);
    }

    // The covers sit in the window's content layout, right over the clipped parts: `above` from the ad's top for
    // `aboveHeight` px, `below` ending at the ad's bottom for `belowHeight` px.
    private void place(Target target, View ad, int w, int aboveHeight, int belowHeight, int adTop) {
        if (!(ad.getLayoutParams() instanceof FrameLayout.LayoutParams)) return;
        int left = ((FrameLayout.LayoutParams) ad.getLayoutParams()).leftMargin;
        int h = ad.getHeight();
        target.coverAbove = layoutCover(target.coverAbove, ad, left, adTop, w, aboveHeight);
        target.coverBelow = layoutCover(target.coverBelow, ad, left, adTop + h - belowHeight, w, belowHeight);
    }

    private View layoutCover(View cover, View ad, int left, int top, int w, int height) {
        ViewGroup content = (ViewGroup) ad.getParent();
        if (height <= 0 || w <= 0) {
            if (cover != null && cover.getVisibility() != View.GONE) cover.setVisibility(View.GONE);
            return cover;
        }
        if (cover == null) {
            cover = new View(ad.getContext());
            cover.setOnTouchListener((v, e) -> {
                // Hand the tap to the page underneath, as if the ad was not there.
                View page = getBridge().getWebView();
                int[] at = new int[2];
                page.getLocationOnScreen(at);
                MotionEvent forwarded = MotionEvent.obtain(e);
                forwarded.setLocation(e.getRawX() - at[0], e.getRawY() - at[1]);
                page.dispatchTouchEvent(forwarded);
                forwarded.recycle();
                return true;
            });
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(w, height);
            params.gravity = android.view.Gravity.TOP | android.view.Gravity.START;
            params.leftMargin = left;
            content.addView(cover, params);
        }
        FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) cover.getLayoutParams();
        if (params.width != w || params.height != height || params.leftMargin != left) {
            params.width = w;
            params.height = height;
            params.leftMargin = left;
            cover.setLayoutParams(params);
        }
        if (cover.getTranslationY() != top) cover.setTranslationY(top);
        if (cover.getVisibility() != View.VISIBLE) cover.setVisibility(View.VISIBLE);
        return cover;
    }

    private void removeCover(View cover) {
        if (cover != null && cover.getParent() instanceof ViewGroup) ((ViewGroup) cover.getParent()).removeView(cover);
    }

    // The MREC is a direct child of the window's content layout; find it by its MAX ad unit id.
    private View find(String unit) {
        ViewGroup content = getActivity().findViewById(android.R.id.content);
        if (content == null) return null;
        for (int i = 0; i < content.getChildCount(); i++) {
            View child = content.getChildAt(i);
            if (!child.getClass().getName().endsWith("MaxAdView")) continue;
            try {
                Method method = child.getClass().getMethod("getAdUnitId");
                if (unit.equals(method.invoke(child))) return child;
            } catch (Exception ignored) {
                // Not the class we expected; keep looking.
            }
        }
        return null;
    }

    private float density() {
        return getContext().getResources().getDisplayMetrics().density;
    }
}
