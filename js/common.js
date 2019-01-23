/**
 * Created by wangyang on 2019-01-23.
 * itwangyang@gmail.com
 * http://itwangyang.xyz
 */
$(".nav-item").click(function () {
    $(this).addClass("active").siblings().removeClass("active");
})
