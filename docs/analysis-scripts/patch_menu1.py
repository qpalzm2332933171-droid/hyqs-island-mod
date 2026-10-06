# -*- coding: utf-8 -*-
import io
p = r'work\mod_java\com\hymod\ModMenu.java'
s = io.open(p, encoding='utf-8').read()

# 1) 保存 tab 滚动容器引用
s = s.replace("    private LinearLayout tabBar;",
              "    private LinearLayout tabBar;\n    private HorizontalScrollView tabScroll;")

s = s.replace("        hs.addView(tabBar);\n        p.addView(hs,",
              "        hs.addView(tabBar);\n        tabScroll = hs;\n        p.addView(hs,")

# 2) 面板高度自适应
old = """        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(320), dp(430));
        lp.leftMargin = dp(40); lp.topMargin = dp(140);"""
new = """        int sh = act.getResources().getDisplayMetrics().heightPixels;
        int ph = Math.min((int) (sh * 0.70f), dp(560));
        int sw = act.getResources().getDisplayMetrics().widthPixels;
        int pw = Math.min(dp(330), (int) (sw * 0.92f));
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(pw, ph);
        lp.leftMargin = dp(20); lp.topMargin = dp(90);"""
assert old in s
s = s.replace(old, new)

# 3) showTab: 标签滚动到可见位置 + 返回顶部
old = """    private void showTab(int idx) {
        curTab = idx;
        for (int i = 0; i < tabBar.getChildCount(); i++) {
            TextView b = (TextView) tabBar.getChildAt(i);
            boolean on = (i == idx);
            b.setTextColor(on ? C_ACC : C_TXT2);
            b.setBackground(on ? bg(C_ITEM2, 8, C_ACC) : null);
        }"""
new = """    private void showTab(int idx) {
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
        }"""
assert old in s
s = s.replace(old, new)

# 4) 开关横排
old = """    private void addSwitch(final JSONObject it) {
        final String id = it.optString("id", "");
        final LinearLayout r = row(it);
        final Switch sw = new Switch(act);
        sw.setChecked(it.optBoolean("val", false));
        sw.setTextColor(C_TXT);
        r.addView(sw);"""
new = """    private void addSwitch(final JSONObject it) {
        final String id = it.optString("id", "");
        final LinearLayout r = row(it);
        final LinearLayout line = new LinearLayout(act);
        line.setOrientation(LinearLayout.HORIZONTAL);
        line.setGravity(Gravity.CENTER_VERTICAL);
        final Switch sw = new Switch(act);
        sw.setChecked(it.optBoolean("val", false));
        sw.setText("");
        sw.setTextColor(C_TXT);
        TextView head = (TextView) r.getChildAt(0);
        if (head != null) {
            r.removeViewAt(0);
            line.addView(head, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        }
        line.addView(sw);
        r.addView(line, 0);"""
assert old in s
s = s.replace(old, new)

# 5) 滑块: 标题与数值同一行
old = """        final TextView valT = tv(String.valueOf(it.optInt("val", min)), 12, C_ACC, true);
        valT.setGravity(Gravity.RIGHT);
        r.addView(valT, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        SeekBar sb = new SeekBar(act);"""
new = """        final TextView valT = tv(String.valueOf(it.optInt("val", min)), 12, C_ACC, true);
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
        SeekBar sb = new SeekBar(act);"""
assert old in s
s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('ModMenu.java patched')
