package com.hymod;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.*;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;

/** 荒野日记:孤岛 原生 MOD 菜单 (可拖动悬浮球 + JsHook 风格面板) */
public class ModMenu {

    private static ModMenu sInst;
    public static ModMenu get() { if (sInst == null) sInst = new ModMenu(); return sInst; }

    private Activity act;
    private FrameLayout root;
    private View ball;
    private LinearLayout panel;
    private LinearLayout tabBar;
    private HorizontalScrollView tabScroll;
    private LinearLayout content;
    private ScrollView contentScroll;
    private TextView titleView, statusView;
    private View picker;
    private int curTab = 0;
    private JSONArray tabs = new JSONArray();
    private final HashMap<String, EditText> inputFields = new HashMap<String, EditText>();

    private float dp1 = 3f;
    private int dp(float v) { return (int) (v * dp1 + 0.5f); }

    /* JsHook 风格配色 */
    private static final int C_PANEL = 0xF00D0F14;
    private static final int C_HEAD  = 0xFF161A22;
    private static final int C_ITEM  = 0xFF1A1F28;
    private static final int C_ITEM2 = 0xFF232A36;
    private static final int C_ACC   = 0xFF6FD08C;
    private static final int C_ACC2  = 0xFF3E7B4F;
    private static final int C_TXT   = 0xFFECEFF4;
    private static final int C_TXT2  = 0xFF8A94A6;
    private static final int C_RED   = 0xFFE06C75;

    private GradientDrawable bg(int color, int radiusDp, int strokeColor) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        if (strokeColor != 0) g.setStroke(dp(1), strokeColor);
        return g;
    }

    private TextView tv(String s, int sizeSp, int color, boolean bold) {
        TextView t = new TextView(act);
        t.setText(s);
        t.setTextSize(sizeSp);
        t.setTextColor(color);
        if (bold) t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        return t;
    }

    /* 输入框统一样式: 深色底 + 亮色字, 避免白底白字看不清 */
    private void styleInput(EditText et, int inputType) {
        et.setTextSize(12);
        et.setTextColor(C_TXT);
        et.setHintTextColor(C_TXT2);
        et.setBackground(bg(C_ITEM2, 6, 0xFF39445A));
        et.setPadding(dp(8), dp(6), dp(8), dp(6));
        et.setInputType(inputType);
        et.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            public void onFocusChange(View v, boolean has) {
                if (has && v instanceof EditText) ((EditText) v).selectAll();
            }
        });
    }

    /* 自绘小开关: 部分 ROM 的系统 Switch 在游戏主题下不可见, 这里完全自绘 */
    private class MiniSwitch extends View {
        boolean on;
        private final android.graphics.Paint pt = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        MiniSwitch(Context c, boolean v) { super(c); on = v; setClickable(true); }
        protected void onMeasure(int w, int h) { setMeasuredDimension(dp(48), dp(26)); }
        protected void onDraw(android.graphics.Canvas cv) {
            int w = getWidth(), h = getHeight();
            pt.setColor(on ? C_ACC2 : 0xFF3A4353);
            cv.drawRoundRect(0, 0, w, h, h / 2f, h / 2f, pt);
            pt.setColor(on ? C_ACC : 0xFF9AA4B4);
            float r = h / 2f - dp(3);
            float cx = on ? (w - h / 2f) : (h / 2f);
            cv.drawCircle(cx, h / 2f, r, pt);
        }
        void setOn(boolean v) { if (on != v) { on = v; invalidate(); } }
    }

    /* ---------------- 挂载 ---------------- */
    public void attach(Activity a) {
        try {
            if (a == null) return;
            dp1 = a.getResources().getDisplayMetrics().density;
            ModBridge.activity = a;
            if (root != null && act == a && root.getParent() != null) return;
            if (root != null && root.getParent() != null) {
                try { ((ViewGroup) root.getParent()).removeView(root); } catch (Throwable t) {}
                root = null; picker = null; panel = null; ball = null; tabBar = null; content = null;
            }
            act = a;
            ViewGroup decor = (ViewGroup) a.getWindow().getDecorView();
            FrameLayout contentRoot = (FrameLayout) decor.findViewById(android.R.id.content);
            ViewGroup target = (contentRoot != null) ? contentRoot : decor;
            root = new FrameLayout(a);
            root.setClipChildren(false);
            root.setClipToPadding(false);
            root.setFocusable(false);
            target.addView(root, new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            makeBall();
            makePanel();
            ModBridge.log("ModMenu attached on " + a.getClass().getSimpleName());
        } catch (Throwable t) { Log.e(ModBridge.TAG, "attach", t); }
    }
    /* 悬浮球: 任意拖动, 位置记忆, 松手吸附到最近的左右边缘 */
    private void makeBall() {
        TextView b = tv("M", 18, Color.WHITE, true);
        b.setGravity(Gravity.CENTER);
        b.setBackground(bg(0xD9202630, 40, C_ACC));
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(46), dp(46));
        lp.leftMargin = ModBridge.prefInt(act, "ball_x", dp(8));
        lp.topMargin  = ModBridge.prefInt(act, "ball_y", dp(120));
        b.setLayoutParams(lp);
        b.setAlpha(0.92f);
        b.setOnTouchListener(new View.OnTouchListener() {
            float dx, dy; int mx, my; boolean moved;
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        dx = e.getRawX(); dy = e.getRawY();
                        mx = ((FrameLayout.LayoutParams) v.getLayoutParams()).leftMargin;
                        my = ((FrameLayout.LayoutParams) v.getLayoutParams()).topMargin;
                        moved = false;
                        v.setAlpha(1f);
                        return true;
                    case MotionEvent.ACTION_MOVE: {
                        int nlx = (int) (mx + e.getRawX() - dx), nly = (int) (my + e.getRawY() - dy);
                        if (Math.abs(e.getRawX() - dx) + Math.abs(e.getRawY() - dy) > dp(6)) moved = true;
                        FrameLayout.LayoutParams p = (FrameLayout.LayoutParams) v.getLayoutParams();
                        p.leftMargin = nlx; p.topMargin = nly; v.setLayoutParams(p);
                        return true;
                    }
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL: {
                        v.setAlpha(0.92f);
                        FrameLayout.LayoutParams p = (FrameLayout.LayoutParams) v.getLayoutParams();
                        int w = root.getWidth(), h = root.getHeight();
                        if (w > 0) {
                            int half = w / 2;
                            p.leftMargin = (p.leftMargin + dp(23) < half) ? dp(6) : (w - dp(52));
                        }
                        if (h > 0) {
                            if (p.topMargin < 0) p.topMargin = 0;
                            if (p.topMargin > h - dp(52)) p.topMargin = h - dp(52);
                        }
                        v.setLayoutParams(p);
                        ModBridge.prefPut(act, "ball_x", p.leftMargin);
                        ModBridge.prefPut(act, "ball_y", p.topMargin);
                        if (!moved && e.getActionMasked() == MotionEvent.ACTION_UP) togglePanel();
                        return true;
                    }
                }
                return false;
            }
        });
        ball = b;
        root.addView(b);
    }

    private void makePanel() {
        LinearLayout p = new LinearLayout(act);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setBackground(bg(C_PANEL, 14, 0xFF2C3542));
        int sh = act.getResources().getDisplayMetrics().heightPixels;
        int ph = Math.min((int) (sh * 0.70f), dp(560));
        int sw = act.getResources().getDisplayMetrics().widthPixels;
        int pw = Math.min(dp(330), (int) (sw * 0.92f));
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(pw, ph);
        lp.leftMargin = dp(20); lp.topMargin = dp(90);
        p.setLayoutParams(lp);
        p.setVisibility(View.GONE);
        p.setElevation(dp(8));

        LinearLayout head = new LinearLayout(act);
        head.setOrientation(LinearLayout.HORIZONTAL);
        head.setGravity(Gravity.CENTER_VERTICAL);
        head.setBackground(bg(C_HEAD, 14, 0));
        head.setPadding(dp(12), dp(9), dp(8), dp(9));
        titleView = tv("MOD", 13, C_ACC, true);
        statusView = tv("", 9, C_TXT2, false);
        statusView.setPadding(dp(8), 0, 0, 0);
        statusView.setSingleLine(true);
        TextView close = tv("✕", 14, C_RED, true);
        close.setPadding(dp(12), dp(2), dp(6), dp(2));
        close.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { panel.setVisibility(View.GONE); } });
        head.addView(titleView, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        head.addView(statusView);
        head.addView(close);
        head.setOnTouchListener(new View.OnTouchListener() {
            float dx, dy; int mx, my;
            public boolean onTouch(View v, MotionEvent e) {
                FrameLayout.LayoutParams p = (FrameLayout.LayoutParams) panel.getLayoutParams();
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN: dx = e.getRawX(); dy = e.getRawY(); mx = p.leftMargin; my = p.topMargin; return true;
                    case MotionEvent.ACTION_MOVE:
                        p.leftMargin = (int) (mx + e.getRawX() - dx); p.topMargin = (int) (my + e.getRawY() - dy);
                        panel.setLayoutParams(p); return true;
                }
                return false;
            }
        });
        p.addView(head, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        HorizontalScrollView hs = new HorizontalScrollView(act);
        hs.setHorizontalScrollBarEnabled(false);
        hs.setBackgroundColor(0xFF131820);
        tabBar = new LinearLayout(act);
        tabBar.setOrientation(LinearLayout.HORIZONTAL);
        tabBar.setPadding(dp(6), dp(4), dp(6), dp(4));
        hs.addView(tabBar);
        tabScroll = hs;
        p.addView(hs, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(38)));

        ScrollView sv = new ScrollView(act);
        content = new LinearLayout(act);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(7), dp(6), dp(7), dp(10));
        sv.addView(content);
        contentScroll = sv;
        p.addView(sv, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        panel = p;
        root.addView(p);
    }

    public void togglePanel() {
        if (panel == null) return;
        boolean show = panel.getVisibility() != View.VISIBLE;
        panel.setVisibility(show ? View.VISIBLE : View.GONE);
        if (show) {
            if (tabs.length() == 0) {
                content.removeAllViews();
                content.addView(tv("菜单数据未就绪\n(等待游戏脚本下发...)", 12, C_TXT2, false));
            }
            ModBridge.fireReady();
        }
    }

    public void setStatus(final String s) {
        if (statusView != null) statusView.setText(s == null ? "" : s);
    }

    public void showMenu() { if (panel != null) { panel.setVisibility(View.VISIBLE); ModBridge.fireReady(); } }
    /* ---------------- 构建菜单 ---------------- */
    public void setMenu(String json) {
        try {
            JSONObject o = new JSONObject(json);
            if (titleView != null) titleView.setText(o.optString("title", "MOD"));
            tabs = o.optJSONArray("tabs");
            if (tabs == null) tabs = new JSONArray();
            buildTabs();
            if (panel.getVisibility() == View.VISIBLE) showTab(curTab);
            ModBridge.log("setMenu tabs=" + tabs.length());
        } catch (Throwable t) { Log.e(ModBridge.TAG, "setMenu " + t); }
    }

    private void buildTabs() {
        tabBar.removeAllViews();
        for (int i = 0; i < tabs.length(); i++) {
            final int idx = i;
            JSONObject t = tabs.optJSONObject(i);
            String name = t == null ? ("T" + i) : t.optString("title", "T" + i);
            TextView b = tv(name, 12, C_TXT2, false);
            b.setGravity(Gravity.CENTER);
            b.setPadding(dp(12), dp(5), dp(12), dp(5));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.rightMargin = dp(4);
            b.setLayoutParams(lp);
            b.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { showTab(idx); } });
            tabBar.addView(b);
        }
    }

    private void showTab(int idx) {
        curTab = idx;
        for (int i = 0; i < tabBar.getChildCount(); i++) {
            TextView b = (TextView) tabBar.getChildAt(i);
            boolean on = (i == idx);
            b.setTextColor(on ? C_ACC : C_TXT2);
            b.setBackground(on ? bg(C_ITEM2, 8, C_ACC) : null);
            if (on && tabScroll != null) {
                final int x = b.getLeft() - dp(10);
                tabScroll.post(new Runnable() { public void run() { tabScroll.smoothScrollTo(Math.max(0, x), 0); } });
            }
        }
        content.removeAllViews();
        if (contentScroll != null) contentScroll.scrollTo(0, 0);
        if (idx < 0 || idx >= tabs.length()) return;
        JSONObject tab = tabs.optJSONObject(idx);
        if (tab == null) return;
        JSONArray items = tab.optJSONArray("items");
        if (items == null) return;
        for (int i = 0; i < items.length(); i++) {
            JSONObject it = items.optJSONObject(i);
            if (it == null) continue;
            String type = it.optString("type", "button");
            if ("text".equals(type)) addText(it);
            else if ("switch".equals(type)) addSwitch(it);
            else if ("slider".equals(type)) addSlider(it);
            else if ("input".equals(type)) addInput(it);
            else if ("picker".equals(type)) addPicker(it);
            else addButton(it);
        }
    }

    private LinearLayout row(JSONObject it) {
        LinearLayout r = new LinearLayout(act);
        r.setOrientation(LinearLayout.VERTICAL);
        r.setBackground(bg(C_ITEM, 9, 0));
        r.setPadding(dp(11), dp(9), dp(11), dp(9));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, dp(6));
        r.setLayoutParams(lp);
        String t = it.optString("title", "");
        String d = it.optString("desc", "");
        if (t.length() > 0) r.addView(tv(t, 12, C_TXT, false));
        if (d.length() > 0) {
            TextView dd = tv(d, 9, C_TXT2, false);
            dd.setPadding(0, dp(3), 0, 0);
            r.addView(dd);
        }
        return r;
    }

    private void addText(JSONObject it) {
        LinearLayout r = new LinearLayout(act);
        r.setOrientation(LinearLayout.VERTICAL);
        r.setBackground(bg(C_HEAD, 9, 0));
        r.setPadding(dp(11), dp(8), dp(11), dp(8));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, dp(6));
        r.setLayoutParams(lp);
        String t = it.optString("title", "");
        if (t.length() > 0) r.addView(tv(t, 11, C_TXT2, false));
        content.addView(r);
    }

    private void addButton(final JSONObject it) {
        final String id = it.optString("id", "");
        final LinearLayout r = row(it);
        r.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                syncInputs();
                ModBridge.fire(id, "1");
                v.setAlpha(0.6f);
                v.postDelayed(new Runnable() { public void run() { r.setAlpha(1f); } }, 120);
            }
        });
        content.addView(r);
    }

    /* 点任意按钮前, 把界面上所有输入框的当前内容同步给 JS(免按"确定") */
    private void syncInputs() {
        for (HashMap.Entry<String, EditText> e : inputFields.entrySet()) {
            try { ModBridge.fire(e.getKey(), e.getValue().getText().toString()); } catch (Throwable t) {}
        }
    }

    private void addSwitch(final JSONObject it) {
        final String id = it.optString("id", "");
        final LinearLayout r = row(it);
        final LinearLayout line = new LinearLayout(act);
        line.setOrientation(LinearLayout.HORIZONTAL);
        line.setGravity(Gravity.CENTER_VERTICAL);
        final MiniSwitch sw = new MiniSwitch(act, it.optBoolean("val", false));
        final TextView state = tv(sw.on ? "开启" : "关闭", 12, sw.on ? C_ACC : C_TXT, true);
        state.setPadding(dp(6), 0, dp(6), 0);
        TextView head = (TextView) r.getChildAt(0);
        if (head != null) {
            r.removeViewAt(0);
            line.addView(head, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        }
        line.addView(state);
        line.addView(sw);
        r.addView(line, 0);
        View.OnClickListener tg = new View.OnClickListener() {
            public void onClick(View v) {
                boolean nv = !sw.on;
                sw.setOn(nv);
                state.setText(nv ? "开启" : "关闭");
                state.setTextColor(nv ? C_ACC : C_TXT);
                ModBridge.fire(id, nv ? "1" : "0");
            }
        };
        sw.setOnClickListener(tg);
        r.setOnClickListener(tg);
        content.addView(r);
    }

    private void addSlider(final JSONObject it) {
        final String id = it.optString("id", "");
        final LinearLayout r = row(it);
        final int min = it.optInt("min", 0), max = it.optInt("max", 100);
        final TextView valT = tv(String.valueOf(it.optInt("val", min)), 12, C_ACC, true);
        valT.setGravity(Gravity.RIGHT);
        TextView head = (TextView) r.getChildAt(0);
        LinearLayout line = new LinearLayout(act);
        line.setOrientation(LinearLayout.HORIZONTAL);
        line.setGravity(Gravity.CENTER_VERTICAL);
        if (head != null) {
            r.removeViewAt(0);
            line.addView(head, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        }
        line.addView(valT);
        r.addView(line, 0);
        SeekBar sb = new SeekBar(act);
        sb.setMax(Math.max(1, max - min));
        sb.setProgress(it.optInt("val", min) - min);
        sb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar s, int p, boolean fromU) { valT.setText(String.valueOf(p + min)); }
            public void onStartTrackingTouch(SeekBar s) {}
            public void onStopTrackingTouch(SeekBar s) { ModBridge.fire(id, String.valueOf(s.getProgress() + min)); }
        });
        r.addView(sb);
        content.addView(r);
    }

    private void addInput(final JSONObject it) {
        final String id = it.optString("id", "");
        final LinearLayout r = row(it);
        LinearLayout line = new LinearLayout(act);
        line.setOrientation(LinearLayout.HORIZONTAL);
        line.setGravity(Gravity.CENTER_VERTICAL);
        final EditText et = new EditText(act);
        et.setText(it.optString("val", ""));
        styleInput(et, InputType.TYPE_CLASS_TEXT);
        et.setSingleLine(true);
        et.setImeOptions(EditorInfo.IME_ACTION_DONE);
        line.addView(et, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        TextView ok = tv("确定", 12, C_ACC, true);
        ok.setPadding(dp(10), dp(6), dp(4), dp(6));
        ok.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { ModBridge.fire(id, et.getText().toString()); }
        });
        line.addView(ok);
        r.addView(line);
        inputFields.put(id, et);
        content.addView(r);
    }

    private void addPicker(final JSONObject it) {
        final String id = it.optString("id", "");
        final LinearLayout r = row(it);
        TextView go = tv("点击选择 ▶", 11, C_ACC, false);
        go.setPadding(0, dp(4), 0, 0);
        r.addView(go);
        r.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { ModBridge.fire(id, "open"); }
        });
        content.addView(r);
    }
    /* ---------------- 物品选择器 (带图标) ---------------- */
    private List<String[]> pickItems = new ArrayList<String[]>();
    private List<Integer> pickShown = new ArrayList<Integer>();
    private HashSet<String> pickChecked = new HashSet<String>();
    private ListView pickList;
    private BaseAdapter pickAdapter;
    private EditText pickSearch, pickCount;
    private boolean panelWasVisible;
    private TextView pickTitle, pickTargetBag, pickTargetWh, pickSelInfo;
    private JSONObject pickMeta = new JSONObject();
    private int pickTarget = 0;   // 0=背包 1=仓库
    private HashMap<String, Bitmap> iconCache = new HashMap<String, Bitmap>();

    public void openItemPicker(String json) {
        try {
            panelWasVisible = panel != null && panel.getVisibility() == View.VISIBLE;
            if (panel != null) panel.setVisibility(View.GONE);
            JSONObject o = new JSONObject(json);
            pickMeta = o;
            pickItems.clear();
            pickChecked.clear();
            JSONArray arr = o.optJSONArray("items");
            for (int i = 0; arr != null && i < arr.length(); i++) {
                JSONObject it = arr.optJSONObject(i);
                if (it == null) continue;
                pickItems.add(new String[]{ it.optString("id"), it.optString("name"), it.optString("cat", "") });
            }
            if (picker == null) makePicker();
            pickSearch.setText("");
            pickCount.setText(o.optString("count", "99"));
            pickTitle.setText(o.optString("title", "选择物品") + "  (共" + pickItems.size() + ")");
            pickTarget = 0;
            updateTargetUI();
            picker.setVisibility(View.VISIBLE);
            picker.bringToFront();
            root.bringChildToFront(picker);
            filter("");
        } catch (Throwable t) { Log.e(ModBridge.TAG, "picker " + t); }
    }

    public void closeItemPicker() {
        if (picker != null) picker.setVisibility(View.GONE);
        if (panel != null && panelWasVisible) panel.setVisibility(View.VISIBLE);
    }

    private void makePicker() {
        FrameLayout wrap = new FrameLayout(act);
        wrap.setBackgroundColor(0xE6000000);
        wrap.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        wrap.setVisibility(View.GONE);
        wrap.setOnTouchListener(new View.OnTouchListener() {
            public boolean onTouch(View v, MotionEvent e) { return true; }
        });

        LinearLayout p = new LinearLayout(act);
        p.setOrientation(LinearLayout.VERTICAL);
        p.setBackground(bg(C_PANEL, 14, 0xFF2C3542));
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(340), dp(540));
        lp.leftMargin = dp(10); lp.topMargin = dp(60);
        lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        p.setLayoutParams(lp);
        p.setPadding(dp(9), dp(9), dp(9), dp(9));

        LinearLayout head = new LinearLayout(act);
        head.setOrientation(LinearLayout.HORIZONTAL);
        head.setGravity(Gravity.CENTER_VERTICAL);
        pickTitle = tv("选择物品", 13, C_ACC, true);
        TextView x = tv("✕", 14, C_RED, true);
        x.setPadding(dp(10), 0, dp(4), 0);
        x.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { closeItemPicker(); } });
        head.addView(pickTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        head.addView(x);
        p.addView(head);

        pickSearch = new EditText(act);
        pickSearch.setHint("搜索 名称 / ID");
        styleInput(pickSearch, InputType.TYPE_CLASS_TEXT);
        pickSearch.setSingleLine(true);
        pickSearch.addTextChangedListener(new TextWatcher() {
            public void afterTextChanged(Editable s) { filter(s.toString()); }
            public void beforeTextChanged(CharSequence s, int a, int b, int c) {}
            public void onTextChanged(CharSequence s, int a, int b, int c) {}
        });
        p.addView(pickSearch, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        LinearLayout line2 = new LinearLayout(act);
        line2.setOrientation(LinearLayout.HORIZONTAL);
        line2.setGravity(Gravity.CENTER_VERTICAL);
        pickTargetBag = tv("发到背包", 12, C_TXT2, true);
        pickTargetBag.setGravity(Gravity.CENTER);
        pickTargetBag.setPadding(dp(8), dp(5), dp(8), dp(5));
        pickTargetWh = tv("发到仓库", 12, C_TXT2, true);
        pickTargetWh.setGravity(Gravity.CENTER);
        pickTargetWh.setPadding(dp(8), dp(5), dp(8), dp(5));
        pickTargetBag.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { pickTarget = 0; updateTargetUI(); } });
        pickTargetWh.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { pickTarget = 1; updateTargetUI(); } });
        line2.addView(pickTargetBag);
        line2.addView(pickTargetWh);
        line2.addView(tv("数量:", 12, C_TXT, false));
        pickCount = new EditText(act);
        pickCount.setText("99");
        styleInput(pickCount, InputType.TYPE_CLASS_NUMBER);
        pickCount.setSingleLine(true);
        line2.addView(pickCount, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        p.addView(line2);

        LinearLayout line3 = new LinearLayout(act);
        line3.setOrientation(LinearLayout.HORIZONTAL);
        line3.setGravity(Gravity.CENTER_VERTICAL);
        TextView selAll = tv("全选", 12, C_ACC, true);
        selAll.setPadding(dp(6), dp(5), dp(10), dp(5));
        selAll.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { setAllShown(true); } });
        TextView selNone = tv("清空", 12, C_ACC, true);
        selNone.setPadding(dp(6), dp(5), dp(10), dp(5));
        selNone.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { pickChecked.clear(); pickAdapter.notifyDataSetChanged(); updateSelInfo(); } });
        pickSelInfo = tv("已选 0", 10, C_TXT2, false);
        line3.addView(selAll); line3.addView(selNone); line3.addView(pickSelInfo);
        p.addView(line3);

        pickList = new ListView(act);
        pickList.setDividerHeight(1);
        pickList.setBackgroundColor(0xFF12161C);
        pickList.setCacheColorHint(0);
        pickAdapter = new BaseAdapter() {
            public int getCount() { return pickShown.size(); }
            public Object getItem(int i) { return pickShown.get(i); }
            public long getItemId(int i) { return i; }
            public View getView(int pos, View convert, ViewGroup parent) {
                LinearLayout rowv = new LinearLayout(act);
                rowv.setOrientation(LinearLayout.HORIZONTAL);
                rowv.setGravity(Gravity.CENTER_VERTICAL);
                rowv.setPadding(dp(8), dp(5), dp(8), dp(5));
                String[] it = pickItems.get(pickShown.get(pos));
                boolean ck = pickChecked.contains(it[0]);
                rowv.setBackgroundColor(ck ? 0xFF243326 : 0x00000000);

                ImageView img = new ImageView(act);
                Bitmap bm = loadIcon(it[0]);
                if (bm != null) img.setImageBitmap(bm); else img.setBackground(bg(0xFF2A3140, 6, 0));
                rowv.addView(img, new LinearLayout.LayoutParams(dp(34), dp(34)));

                LinearLayout col = new LinearLayout(act);
                col.setOrientation(LinearLayout.VERTICAL);
                col.setPadding(dp(9), 0, 0, 0);
                col.addView(tv(it[1], 12, ck ? C_ACC : C_TXT, ck));
                col.addView(tv("#" + it[0] + (it[2].length() > 0 ? ("  [" + it[2] + "]") : ""), 9, C_TXT2, false));
                rowv.addView(col, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

                TextView chk = tv(ck ? "✔" : "", 14, C_ACC, true);
                rowv.addView(chk);
                return rowv;
            }
        };
        pickList.setAdapter(pickAdapter);
        pickList.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            public void onItemClick(AdapterView<?> a, View v, int pos, long id) {
                String iid = pickItems.get(pickShown.get(pos))[0];
                if (pickChecked.contains(iid)) pickChecked.remove(iid); else pickChecked.add(iid);
                pickAdapter.notifyDataSetChanged();
                updateSelInfo();
            }
        });
        p.addView(pickList, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        LinearLayout btns = new LinearLayout(act);
        btns.setOrientation(LinearLayout.HORIZONTAL);
        TextView cancel = tv("取消", 13, C_TXT2, true);
        cancel.setGravity(Gravity.CENTER); cancel.setPadding(0, dp(9), 0, dp(9));
        cancel.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { closeItemPicker(); } });
        TextView ok = tv("确 认 发 放", 13, C_ACC, true);
        ok.setGravity(Gravity.CENTER); ok.setPadding(0, dp(9), 0, dp(9));
        ok.setBackground(bg(C_ITEM2, 8, C_ACC2));
        ok.setOnClickListener(new View.OnClickListener() { public void onClick(View v) { confirmPick(); } });
        btns.addView(cancel, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        btns.addView(ok, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.6f));
        p.addView(btns);

        wrap.addView(p);
        picker = wrap;
        root.addView(wrap);
    }
    private void updateTargetUI() {
        pickTargetBag.setBackground(pickTarget == 0 ? bg(C_ITEM2, 7, C_ACC) : null);
        pickTargetWh.setBackground(pickTarget == 1 ? bg(C_ITEM2, 7, C_ACC) : null);
        pickTargetBag.setTextColor(pickTarget == 0 ? C_ACC : C_TXT2);
        pickTargetWh.setTextColor(pickTarget == 1 ? C_ACC : C_TXT2);
    }

    private void updateSelInfo() {
        if (pickSelInfo != null) pickSelInfo.setText("已选 " + pickChecked.size());
    }

    private void setAllShown(boolean v) {
        for (int i = 0; i < pickShown.size(); i++) {
            String iid = pickItems.get(pickShown.get(i))[0];
            if (v) pickChecked.add(iid); else pickChecked.remove(iid);
        }
        pickAdapter.notifyDataSetChanged();
        updateSelInfo();
    }

    private void filter(String q) {
        pickShown.clear();
        q = q == null ? "" : q.trim().toLowerCase();
        for (int i = 0; i < pickItems.size(); i++) {
            String[] it = pickItems.get(i);
            if (q.length() == 0 || it[0].contains(q) || it[1].toLowerCase().contains(q) || it[2].toLowerCase().contains(q))
                pickShown.add(i);
        }
        if (pickAdapter != null) pickAdapter.notifyDataSetChanged();
    }

    private void confirmPick() {
        try {
            String cnt = pickCount.getText().toString();
            JSONArray ids = new JSONArray();
            for (int i = 0; i < pickItems.size(); i++) {
                String iid = pickItems.get(i)[0];
                if (pickChecked.contains(iid)) ids.put(iid);
            }
            if (ids.length() == 0) { ModBridge.toast("未选中任何物品"); return; }
            JSONObject o = new JSONObject();
            o.put("ids", ids);
            o.put("count", cnt);
            o.put("target", pickTarget == 1 ? "warehouse" : "bag");
            o.put("action", pickMeta.optString("action", "grant"));
            closeItemPicker();
            ModBridge.firePick(o.toString());
        } catch (Throwable t) { Log.e(ModBridge.TAG, "confirmPick " + t); }
    }

    /* 从 APK assets/hymod/icons/<id>.png 读取物品图标 */
    private Bitmap loadIcon(String id) {
        if (iconCache.containsKey(id)) return iconCache.get(id);
        Bitmap bm = null;
        try {
            InputStream in = act.getAssets().open("hymod/icons/" + id + ".png");
            bm = BitmapFactory.decodeStream(in);
            in.close();
        } catch (Throwable t) { }
        if (bm == null) {
            int u = id.indexOf('_');
            if (u > 0) {
                try {
                    InputStream in = act.getAssets().open("hymod/icons/" + id.substring(0, u) + ".png");
                    bm = BitmapFactory.decodeStream(in);
                    in.close();
                } catch (Throwable t) { }
            }
        }
        iconCache.put(id, bm);
        return bm;
    }
}
