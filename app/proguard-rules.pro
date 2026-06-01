-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep public class com.arvan.scanner.MainActivity$WebAppInterface {
    public *;
}
