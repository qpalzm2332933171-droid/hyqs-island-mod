package com.hymod;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

/** JS <-> Java 桥: JS 通过 jsb.reflection.callStaticMethod("com/hymod/ModBridge", ...) 调用 */
public class ModBridge {
    public static final String TAG = "HYMOD";
    public static Activity activity;
    private static final Handler UI = new Handler(Looper.getMainLooper());
    private static SharedPreferences prefs;

    private static SharedPreferences p(Context c) {
        if (prefs == null) prefs = c.getApplicationContext().getSharedPreferences("hymod", Context.MODE_PRIVATE);
        return prefs;
    }
    public static void prefPut(Context c, String k, int v) { try { p(c).edit().putInt(k, v).apply(); } catch (Throwable t) {} }
    public static int prefInt(Context c, String k, int d) { try { return p(c).getInt(k, d); } catch (Throwable t) { return d; } }

    public static void log(String s) { Log.i(TAG, s); }

    public static void toast(final String msg) {
        final Activity a = activity;
        if (a == null) { Log.i(TAG, "toast(no act): " + msg); return; }
        UI.post(new Runnable() { public void run() {
            try { Toast.makeText(a, msg, Toast.LENGTH_SHORT).show(); } catch (Throwable t) {}
        }});
    }

    public static void setMenu(final String json) {
        UI.post(new Runnable() { public void run() {
            try { ModMenu.get().setMenu(json); } catch (Throwable t) { Log.e(TAG, "setMenu " + t); }
        }});
    }

    public static void openItemPicker(final String json) {
        UI.post(new Runnable() { public void run() {
            try { ModMenu.get().openItemPicker(json); } catch (Throwable t) { Log.e(TAG, "picker " + t); }
        }});
    }

    public static void setStatus(final String s) {
        UI.post(new Runnable() { public void run() {
            try { ModMenu.get().setStatus(s); } catch (Throwable t) {}
        }});
    }

    public static void showMenu() {
        UI.post(new Runnable() { public void run() {
            try { ModMenu.get().showMenu(); } catch (Throwable t) {}
        }});
    }

    public static void closeItemPicker() {
        UI.post(new Runnable() { public void run() {
            try { ModMenu.get().closeItemPicker(); } catch (Throwable t) {}
        }});
    }

    /** Java -> 游戏 JS (在 GL 线程执行) */
    public static void callJs(final String js) {
        try {
            final Class<?> helper = Class.forName("org.cocos2dx.lib.Cocos2dxHelper");
            final Class<?> bridge = Class.forName("org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge");
            final java.lang.reflect.Method eval = bridge.getMethod("evalString", String.class);
            final java.lang.reflect.Method runOnGL = helper.getMethod("runOnGLThread", Runnable.class);
            Runnable r = new Runnable() { public void run() {
                try { eval.invoke(null, js); } catch (Throwable t) { Log.e(TAG, "eval " + t); }
            }};
            runOnGL.invoke(null, r);
        } catch (Throwable t) { Log.e(TAG, "callJs " + t); }
    }

    public static void fire(String id, String val) {
        callJs("window.HYMOD_ON&&HYMOD_ON(" + q(id) + "," + q(val) + ")");
    }
    public static void firePick(String json) {
        callJs("window.HYMOD_PICK&&HYMOD_PICK(" + q(json) + ")");
    }
    public static void fireReady() {
        callJs("window.HYMOD_UI_READY&&HYMOD_UI_READY()");
    }

    public static String q(String s) {
        if (s == null) s = "";
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') sb.append('\\').append(c);
            else if (c == '\n') sb.append("\\n");
            else if (c == '\r') sb.append("\\r");
            else sb.append(c);
        }
        return sb.append('"').toString();
    }
}
